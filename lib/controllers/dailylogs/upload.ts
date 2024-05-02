import { Hono } from "hono";
import { AGUploader, httpRequestPut } from "../../services/AGUploader";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { jwt } from "hono/jwt";
import { Worker } from "node:worker_threads";
import { compressImage, convertWebp } from "../../services/AGImageCompress";
import { settings } from "../../constants/global-settings";
import { STAFF_MEDIA_VIEWABLE_ROLE } from "../portfolio/album-base-API";
import FCMService from "../../services/FCMService";
// import { zu } from 'zod_utilz'

export enum AGMediaStateEnum {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    REJECTED = "REJECTED",
}

const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const ALLOWED_ACTIVE_DIARY = ["Check In", "Check Out"];

interface IUploadedMedia {
    mediaURL: string;
}

const zDiaryUploadTypes = z.object({
    image0: z.any(),
    image1: z.any(),
    image2: z.any(),
    image3: z.any(),
    image4: z.any(),
    category: z.string(),
    description: z.string(),
    diaryDetails: z.string().transform((str, ctx) => {
        try {
            return JSON.parse(str);
        } catch (error) {
            ctx.addIssue({ code: "custom", message: "Invalid JSON received." });
            return z.NEVER;
        }
    }), // JSON !!
    temperature: z.string().optional(),
    // PARK HERE NEW UPDATE
    // timeposted: z.date(),
    timeposted: z.string().refine((value) => {
        return DateTime.fromISO(value).isValid;
    }),
    // timeposted: z.coerce.date().optional(),
});

type IDiaryPostedDetails = z.infer<typeof zDiaryUploadTypes>;

class AGError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AGError";
    }
}

const dailyLogsHandler = new Hono();

// Hono middleware check jwt
dailyLogsHandler.post(
    "/:studentid/create",
    zValidator("form", zDiaryUploadTypes),
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        // const data = await c.req.blob

        try {
            const body = await c.req.parseBody<IDiaryPostedDetails>();

            const keys = Object.keys(body);

            for (const [k, v] of Object.entries(body)) {
                if (k.startsWith("image")) {
                    if (!/image[0-4]$/g.test(k)) {
                        throw new AGError(
                            "Too many images or invalid image argument received."
                        );
                    }

                    const fileType = (v as File).type;

                    if (!fileType) {
                        throw new AGError(`${k} argument must be a file.`);
                    }

                    if (!ACCEPTED_IMAGE_TYPES.includes(fileType)) {
                        throw new AGError(
                            `${k}: Invalid file type received: (${fileType})`
                        );
                    }
                } else if (typeof v !== "string") {
                    throw new AGError("Invalid payload argument received.");
                }
            }

            const providedImages = keys.filter((item) =>
                item.startsWith("image")
            );

            if (!Boolean(body.category)) {
                throw new AGError("Category is required.");
            }

            const studentID = c.req.param("studentid");

            let studentBranch = "";

            if (studentID.includes("$")) {
                const studentIDs = studentID.split("$");

                const studentData = await prisma.students.findMany({
                    where: {
                        StudentID: {
                            in: studentIDs,
                        },
                    },
                    include: {
                        Parents: true,
                        AGClasses: {
                            select: {
                                ClassName: true,
                                Branch: {
                                    select: {
                                        BranchName: true,
                                    },
                                },
                            },
                        },
                    },
                });

                if (studentData.length !== studentIDs.length) {
                    throw new AGError(
                        "Whoops, some student is not registered in our database."
                    );
                }

                studentBranch = studentData
                    .map(
                        (item) =>
                            `${item.AGClasses.join(" & ")} (${
                                item.AGClasses[0].Branch?.BranchName
                            })`
                    )
                    .join(", ");

                const uploader = new AGUploader();

                const payload = c.get("jwtPayload");

                const promises = [];
                const uploaded: IUploadedMedia[] = [];

                for (const [index, item] of providedImages.entries()) {
                    const arrBuf = await (
                        body[item as keyof typeof body] as Blob
                    ).arrayBuffer();

                    // const worker = new Worker('./lib/controllers/dailylogs/worker.js', {
                    //     workerData: {
                    //         fileName: doLocation,
                    //         file: new Uint8Array(arrBuf)
                    //     }
                    // });

                    const mediaURL = `diaries/${DateTime.now().toISODate()}/${studentID}/${
                        body.category as String
                    }/${index}_${DateTime.now().toISO()}.webp`;

                    // worker.postMessage({
                    //     fileName: doLocation,
                    //     file: body[item] as any
                    // });

                    // const arr = new Uint8Array(await photo.arrayBuffer());

                    const compressedArr = await convertWebp({
                        buffer: new Uint8Array(arrBuf),
                        quality: 85,
                    });

                    uploaded.push({
                        mediaURL: mediaURL,
                    });

                    promises.push(
                        uploader.uploadToS3({
                            file: compressedArr,
                            fileName: mediaURL,
                            publicACL: true,
                        })
                    );
                }

                const data = await Promise.all(promises);

                const userMediaState = ALLOWED_ACTIVE_DIARY.includes(
                    body.category as string
                )
                    ? AGMediaStateEnum.ACTIVE
                    : AGMediaStateEnum.PENDING;

                const dbUploadData = await prisma.$transaction(
                    uploaded.map((item) =>
                        prisma.aGMedia.create({
                            data: {
                                UploadedAt: DateTime.now().toJSDate(),
                                MediaType: "image-diaries",
                                MediaURL: `${settings.cdnUrl}/${item.mediaURL}`,
                                MediaKey: item.mediaURL,
                                UploadedBy: {
                                    connect: {
                                        UserID: payload.sub,
                                    },
                                },
                                MediaState: userMediaState,
                            },
                        })
                    )
                );
                const studentTransaction = await prisma.dailyLogs.create({
                    data: {
                        Timestamp: DateTime.now().toJSDate(),
                        Temperature: body.temperature
                            ? parseFloat(body.temperature as string)
                            : null,
                        DailyLogsType: {
                            create: {
                                Type: body.category as string,
                                Description: body.description as string,
                                Content: body.diaryDetails as string,
                            },
                        },
                        Medias: {
                            connect: dbUploadData.map((item) => {
                                return {
                                    MediaID: item.MediaID,
                                };
                            }),
                        },
                        UploadedBy: {
                            connect: {
                                UserID: payload.sub,
                            },
                        },
                        Students: {
                            connect: studentIDs.map((item) => ({
                                StudentID: item,
                            })),
                        },
                        // FStudentID: studentID,
                    },
                });

                return c.json({
                    success: true,
                    message: `Diary for ${studentIDs.length} students has been created successfully.`,
                    data: {
                        // student: studentTransaction,
                    },
                });
            } else {
                const studentData = await prisma.students.findFirst({
                    where: {
                        StudentID: studentID,
                    },
                    include: {
                        Parents: {
                            include: {
                                UsersAuth: true
                            }
                        },
                        AGClasses: {
                            select: {
                                ClassName: true,
                                Branch: {
                                    select: {
                                        BranchName: true,
                                    },
                                },
                            },
                        },
                    },
                });

                if (!studentData) {
                    throw new AGError(
                        "Whoops, student is not registered in our database."
                    );
                }

                studentBranch = `${studentData.AGClasses.join(" & ")} (${
                    studentData.AGClasses[0].Branch?.BranchName
                })`;

                const uploader = new AGUploader();

                const payload = c.get("jwtPayload");

                const promises = [];
                const uploaded: IUploadedMedia[] = [];

                for (const [index, item] of providedImages.entries()) {
                    // const arrBuf = await (body[item] as Blob).arrayBuffer();
                    const arrBuf = await (
                        body[item as keyof typeof body] as Blob
                    ).arrayBuffer();

                    // const doLocation = `diaries/${studentData.Parents.map(
                    //     (item) => item.UserID
                    // ).join(
                    //     "|"
                    // )}/${DateTime.now().toISODate()}/${index}-${fileName}`;

                    const mediaURL = `diaries/${DateTime.now().toISODate()}/${studentID}/${
                        body.category as String
                    }/${index}_${DateTime.now().toISO()}.webp`;

                    // const worker = new Worker('./lib/controllers/dailylogs/worker.js', {
                    //     workerData: {
                    //         fileName: doLocation,
                    //         file: new Uint8Array(arrBuf)
                    //     }
                    // });

                    // worker.postMessage({
                    //     fileName: doLocation,
                    //     file: body[item] as any
                    // });

                    // const arr = new Uint8Array(await photo.arrayBuffer());

                    const compressedArr = await convertWebp({
                        buffer: new Uint8Array(arrBuf),
                        quality: 85,
                    });

                    uploaded.push({
                        mediaURL: mediaURL,
                    });

                    promises.push(
                        uploader.uploadToS3({
                            file: compressedArr,
                            fileName: mediaURL,
                            publicACL: true,
                        })
                    );
                }

                const data = await Promise.all(promises);

                const userMediaState = ALLOWED_ACTIVE_DIARY.includes(
                    body.category as string
                )
                    ? AGMediaStateEnum.ACTIVE
                    : AGMediaStateEnum.PENDING;

                const dbUploadData = await prisma.$transaction(
                    uploaded.map((item) =>
                        prisma.aGMedia.create({
                            data: {
                                UploadedAt: DateTime.now().toJSDate(),
                                MediaType: "image-diaries",
                                MediaURL: `${settings.cdnUrl}/${item.mediaURL}`,
                                MediaKey: item.mediaURL,
                                UploadedBy: {
                                    connect: {
                                        UserID: payload.sub,
                                    },
                                },
                                MediaState: userMediaState,
                            },
                        })
                    )
                );

                const studentTransaction = await prisma.dailyLogs.create({
                    data: {
                        Timestamp: DateTime.now().toJSDate(),
                        // PARK HERE NEW UPDATE
                        TimePosted: DateTime.fromISO(
                            body.timeposted as string
                        ).toJSDate(),
                        Temperature: body.temperature
                            ? parseFloat(body.temperature as string)
                            : null,
                        DailyLogsType: {
                            create: {
                                Type: body.category as string,
                                Description: body.description as string,
                                Content: body.diaryDetails as string,
                            },
                        },
                        Medias: {
                            connect: dbUploadData.map((item) => {
                                return {
                                    MediaID: item.MediaID,
                                };
                            }),
                        },
                        UploadedBy: {
                            connect: {
                                UserID: payload.sub,
                            },
                        },
                        Students: {
                            connect: {
                                StudentID: studentID,
                            },
                        },
                        // FStudentID: studentID,
                    },
                });

                console.log(studentTransaction);

                // IF OTHER ACTIVITY THAN CHECK IN & OUT, SEND NOTIFICATION TO ADMINISTRATORS TO APPROVE MEDIAS
                if (!ALLOWED_ACTIVE_DIARY.includes(body.category)) {
                    // Begin send notification to administrators
                    const admins = await prisma.users.findMany({
                        where: {
                            Role: {
                                some: {
                                    RoleName: "Administrator",
                                },
                            },
                        },
                        select: {
                            UsersAuth: {
                                select: {
                                    FCMToken: true,
                                },
                            },
                        },
                    });

                    await FCMService.broadcastNotification(
                        admins
                            .map((item) => item.UsersAuth?.FCMToken ?? "")
                            .filter((item) => item !== ""),
                        {
                            // TODO!
                            message: `${body.category} | ${studentBranch}`,
                            title: "[MEDIA APPROVAL] Pending Approval",
                        }
                    );
                }
                else {

                    // THIS IS CHECK IN & OUT BLOCK. SEND NOTIFICATION TO PARENTS OF CHILD
                    const parentTokens = studentData.Parents.map(
                        (item) => item.UsersAuth?.FCMToken ?? ""
                    ).filter((item) => item !== "");

                    if (body.category === 'Check In') {
                        await FCMService.broadcastNotification(parentTokens, {
                            message: `Good morning ${studentData.FullName}! Your child has checked in. Have a great day! 👶🏻`,
                            title: "Diary - Check In",
                        });
                    }

                    if (body.category === 'Check Out') {
                        await FCMService.broadcastNotification(parentTokens, {
                            message: `Goodbye ${studentData.FullName}! Your child has checked out. See you tomorrow! 👶🏻`,
                            title: "Diary - Check Out",
                        });
                    }

                }

                return c.json({
                    success: true,
                    message: `Diary for ${studentData.FullName} has been created successfully.`,
                    data: {
                        // student: studentTransaction,
                    },
                });
            }

            // End send notification to administrators

            // worker.onmessage = (event) => {
            //     console.log(event.data);
            // };

            // const fileName = `${studentData.FullName.replaceAll(" ", "")}-by-${
            //     payload.email
            // }-${DateTime.now().toISO()}`;

            // const workerURL = new URL("worker.js", import.meta.url).href;

            // diaries/[uid]/[ISO Date]/[studentname]-by-[teachersname]-timestamp.webp

            // const promises = providedImages.map(async (item, index) => {

            // });

            // const data = await Promise.all(promises);

            // const dbUploadData = await prisma.$transaction(
            //     uploaded.map((item) =>
            //         prisma.aGMedia.create({
            //             data: {
            //                 UploadedAt: DateTime.now().toJSDate(),
            //                 MediaType: "image-diaries",
            //                 MediaURL: `${settings.cdnUrl}/${item.mediaURL}`,
            //                 MediaKey: item.mediaURL,
            //                 UploadedBy: {
            //                     connect: {
            //                         UserID: payload.sub,
            //                     },
            //                 },
            //             },
            //         })
            //     )
            // );

            // const agMedias = await prisma.aGMedia.createMany({
            //     data: data.map((item) => {
            //         return {
            //             MediaType: "image", // TODO: Add video support
            //             MediaURL: item.Location,
            //             MediaKey: item.Key,
            //         }
            //     }),
            // })

            // const studentTransaction = await prisma.students.update({
            //     where: {
            //         StudentID: studentID,
            //     },
            //     data: {
            //         DailyLogs: {
            //             create: {
            //                 Temperature: body.temperature
            //                     ? parseFloat(body.temperature as string)
            //                     : null,
            //                 DailyLogsType: {
            //                     create: {
            //                         Type: body.category as string,
            //                         Description: body.description as string,
            //                         Content: body.diaryDetails as string,
            //                     },
            //                 },
            //                 Medias: {
            //                     connect: dbUploadData.map((item) => {
            //                         return {
            //                             MediaID: item.MediaID,
            //                         };
            //                     }),
            //                 },
            //                 UploadedBy: {
            //                     connect: {
            //                         UserID: payload.sub,
            //                     },
            //                 },
            //             },
            //         },
            //     },
            // });

            // const dailyLogDB = await prisma.dailyLogs.create({
            //     data: {
            //         Temperature: body.temperature ? parseFloat(body.temperature as string) : null,
            //         DailyLogsType: {
            //             create: {
            //                 Type: body.category as string,
            //                 Description: body.description as string,
            //                 Content: body.diaryDetails as string,
            //             }
            //         },
            //         Medias: {
            //             connect: [
            //                 ...dbUploadData.map((item) => {
            //                     return {
            //                         MediaID: item.MediaID,
            //                     }
            //                 })
            //             ]
            //         },
            //         UploadedBy: {
            //             connect: {
            //                 UserID: payload.sub,
            //             }
            //         }
            //     },
            // })

            // await prisma.users.update({
            //     where: {
            //         UserID: payload.sub,
            //     },
            //     data: {
            //         DailyLogs: {
            //             connect: {
            //                 DailyLogsID: dailyLogDB.DailyLogsID,
            //             }
            //         }
            //     }
            // })

            // return c.json({
            //     success: true,
            //     message: `Diary for ${studentData.FullName} has been created successfully.`,
            //     data: {
            //         // student: studentTransaction,
            //     },
            // });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json(
                    {
                        message: "error",
                        success: false,
                        data: error.issues,
                    },
                    400
                );
            } else {
                // console.log(error);

                if (error instanceof AGError) {
                    return c.json(
                        {
                            message: error.message,
                            success: false,
                            data: {},
                        },
                        400
                    );
                } else {
                    console.log(error);

                    return c.json(
                        {
                            message: "Something went wrong.",
                            success: false,
                            data: {},
                        },
                        500
                    );
                }
            }
        }
    }
);

//   TileLogs(
//     tileItem: TileItem(
//       title: 'Tidur',
//       time: DateTime.now(),
//       imagesUri: const ['https://picsum.photos/id/1/200/300'],
//       description: 'Akim sangat sedap tidur',
//       temperature: 12.2,
//       teacherName: 'Teacher Amirah',
//     ),
//     isItemLast: true,
//   ),

dailyLogsHandler.get(
    "/:studentid/list",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        try {
            const studentid = c.req.param("studentid");

            let dt: DateTime | null;

            dt = DateTime.fromISO(c.req.query("time") ?? "");

            const payload = c.get("jwtPayload");

            console.log(c.req.query("time"));

            const isStaff = (payload["role"] as string[]).some((userRole) =>
                STAFF_MEDIA_VIEWABLE_ROLE.includes(userRole)
            );

            console.log(isStaff);

            if (!dt.isValid) {
                // If no time provided, query all logs (paginated)

                const pageKey = parseInt(c.req.query("page") ?? "0");
                const pageSize = Math.min(
                    parseInt(c.req.query("size") ?? "20"),
                    20
                );

                const data = await prisma.dailyLogs.findMany({
                    where: {
                        Students: {
                            some: {
                                StudentID: studentid,
                            },
                        },

                        OR: [
                            {
                                Medias: {
                                    some: {
                                        MediaState: {
                                            in: isStaff
                                                ? [
                                                      AGMediaStateEnum.ACTIVE,
                                                      AGMediaStateEnum.PENDING,
                                                  ]
                                                : [
                                                      AGMediaStateEnum.ACTIVE,
                                                      AGMediaStateEnum.PENDING,
                                                  ],
                                        },
                                    },
                                },
                            },
                            {
                                Medias: {
                                    none: {},
                                },
                            },
                        ],
                    },
                    include: {
                        Medias: true,
                        Students: {
                            select: {
                                FullName: true,
                                PictureURL: {
                                    select: {
                                        MediaURL: true,
                                    },
                                },
                            },
                        },
                        DailyLogsType: true,
                        UploadedBy: {
                            select: {
                                FullName: true,
                                UserID: true,
                                ProfilePicture: {
                                    select: {
                                        MediaURL: true,
                                    },
                                },
                            },
                        },
                    },
                    // skip: pageKey * pageSize,
                    // take: pageSize,
                    orderBy: {
                        Timestamp: "desc",
                    },
                });

                if (!data) {
                    return c.json(
                        {
                            message: "No data or student found!",
                            success: false,
                            data: {},
                        },
                        400
                    );
                }

                return c.json({
                    message: `${data.length} data found for ${studentid}`,
                    success: true,
                    data: data,
                });
            } else {
                const data = await prisma.dailyLogs.findMany({
                    where: {
                        Students: {
                            some: {
                                StudentID: studentid,
                            },
                        },
                        Timestamp: {
                            gte: dt.toJSDate(),
                            lt: dt.plus({ days: 1 }).toJSDate(),
                        },
                        OR: [
                            {
                                Medias: {
                                    some: {
                                        MediaState: {
                                            in: isStaff
                                                ? [
                                                      AGMediaStateEnum.ACTIVE,
                                                      AGMediaStateEnum.PENDING,
                                                  ]
                                                : [
                                                      AGMediaStateEnum.ACTIVE,
                                                      AGMediaStateEnum.PENDING,
                                                  ],
                                        },
                                    },
                                },
                            },
                            {
                                Medias: {
                                    none: {},
                                },
                            },
                        ],
                        // Medias: {
                        //     some: {
                        //         MediaState: {
                        //             in: isStaff
                        //                 ? [
                        //                       AGMediaStateEnum.ACTIVE,
                        //                       AGMediaStateEnum.PENDING,
                        //                   ]
                        //                 : [AGMediaStateEnum.ACTIVE],
                        //         },
                        //     },
                        // },
                    },
                    include: {
                        Medias: true,
                        Students: {
                            select: {
                                FullName: true,
                                PictureURL: {
                                    select: {
                                        MediaURL: true,
                                    },
                                },
                            },
                        },
                        DailyLogsType: true,
                        UploadedBy: {
                            select: {
                                FullName: true,
                                UserID: true,
                                ProfilePicture: {
                                    select: {
                                        MediaURL: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        Timestamp: "desc",
                    },
                });

                if (!data) {
                    return c.json(
                        {
                            message: "No data or student found!",
                            success: false,
                            data: {},
                        },
                        400
                    );
                }

                return c.json({
                    message: `${
                        data.length
                    } data found for ${studentid} on ${dt.toFormat(
                        "dd/MM/yyyy"
                    )}`,
                    success: true,
                    data: data,
                });
            }
        } catch (error) {
            console.log(error);

            return c.json(
                {
                    message: "Something went wrong",
                    success: false,
                    data: {},
                },
                500
            );
        }
    }
);

dailyLogsHandler.get(
    "/parents/:studentid/list",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        try {
            const payload = c.get("jwtPayload");

            const userID = payload["sub"];

            const studentID = c.req.param("studentid");

            let dt: DateTime | null;

            dt = DateTime.fromISO(c.req.query("time") ?? "");

            if (!dt.isValid) {
                return c.json({
                    message: "Invalid date format",
                    success: false,
                    data: {},
                });
            }

            // check if user is the parent of the student
            const studentData = await prisma.students.findFirst({
                where: {
                    StudentID: studentID,
                    Parents: {
                        some: {
                            UserID: userID,
                        },
                    },
                },
            });

            if (!studentData) {
                return c.json(
                    {
                        message: "Student not found",
                        success: false,
                        data: {},
                    },
                    400
                );
            }

            const data = await prisma.dailyLogs.findMany({
                where: {
                    Students: {
                        some: {
                            StudentID: studentID,
                        },
                    },
                    Timestamp: {
                        gte: dt.toJSDate(),
                        lt: dt.plus({ days: 1 }).toJSDate(),
                    },
                },
                select: {
                    Students: {
                        select: {
                            FullName: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                        },
                    },
                    DLID: true,
                    Temperature: true,
                    Timestamp: true,
                    FUserID: true,
                    FStudentID: true,
                    DailyLogsType: true,
                    UploadedBy: {
                        select: {
                            FullName: true,
                            UserID: true,
                            ProfilePicture: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                        },
                    },
                    Medias: {
                        select: {
                            MediaDescription: true,
                            MediaURL: true,
                            MediaKey: true,
                            UploadedAt: true,
                        },
                    },
                },
            });

            return c.json({
                message: `Data for ${data.length} students found`,
                success: true,
                data: data,
            });

        } catch (error) {

            console.log(error)

            return c.json(
                {
                    message: "Something went wrong",
                    success: false,
                    data: error,
                },
                500
            );
        }
    }
);

dailyLogsHandler.get(
    "/list",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        try {
            // If no time provided, query all logs (paginated)

            const pageKey = parseInt(c.req.query("page") ?? "0");
            const pageSize = Math.min(
                parseInt(c.req.query("size") ?? "20"),
                20
            );

            const userID = c.get("jwtPayload")["sub"];

            const data = await prisma.users.findFirst({
                where: {
                    UserID: userID,
                },
                select: {
                    Children: {
                        select: {
                            FullName: true,
                            StudentID: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                            DailyLogs: {
                                select: {
                                    DLID: true,
                                    Temperature: true,
                                    Timestamp: true,
                                    FUserID: true,
                                    FStudentID: true,
                                    DailyLogsType: true,
                                    UploadedBy: {
                                        select: {
                                            FullName: true,
                                            UserID: true,
                                            ProfilePicture: {
                                                select: {
                                                    MediaURL: true,
                                                },
                                            },
                                        },
                                    },
                                    Medias: {
                                        select: {
                                            MediaDescription: true,
                                            MediaURL: true,
                                            MediaKey: true,
                                            UploadedAt: true,
                                        },
                                    },
                                },
                                //                                take: pageSize,
                                //                                skip: pageKey * pageSize,
                            },
                        },
                    },
                },
            });

            if (!data) {
                return c.json(
                    {
                        message: "No data or student found!",
                        success: false,
                        data: {},
                    },
                    400
                );
            }

            return c.json({
                message: `Data for ${data.Children.length} students found`,
                success: true,
                data: data,
            });
        } catch (error) {
            console.log(error);

            return c.json(
                {
                    message: "Something went wrong",
                    success: false,
                    data: {},
                },
                500
            );
        }
    }
);

export { dailyLogsHandler };

// const clientUrl = await createPresignedUrlWithClient({
//     bucket: "ag4u-staging",
//     key: `${nanoid()}.webp`,
// });

// const arrBuf = await data.arrayBuffer()

// const imageBufPreview = await sharp(arrBuf)
//     .webp({ quality: 80 })
//     .resize(320, 320, { fit: 'inside' })
//     .toBuffer()

// const response = await httpRequestPut(clientUrl, imageBufPreview)

// console.log(response);
