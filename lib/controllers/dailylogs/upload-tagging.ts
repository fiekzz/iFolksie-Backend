import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { AGUploader } from "../../services/AGUploader";
import { DateTime } from "luxon";
import { convertWebp } from "../../services/AGImageCompress";
import { settings } from "../../constants/global-settings";

const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

// TODO DIARY UPLOAD TAGGING STUDENTS

const ALLOWED_ACTIVE_DIARY = ["Check In", "Check Out"];

interface IUploadedMedia {
    mediaURL: string;
}

class AGError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AGError";
    }
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
    timeposted: z.string(),
    studentIdList: z.string().transform((str, ctx) => {
        try {
            return JSON.parse(str);

        } catch (err) {
            ctx.addIssue({ code: "custom", message: "Invalid JSON received." });
            return z.NEVER;
        }
    }),
})

const uploadTagging = new Hono()

type IDiaryUploadTagging = z.infer<typeof zDiaryUploadTypes>

uploadTagging.post(
    "/create",
    zValidator("form", zDiaryUploadTypes),
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const body = await c.req.parseBody<IDiaryUploadTagging>();

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

            const studentIDList = JSON.parse(body.studentIdList) as string[]
            

            if (studentIDList.length === 0) {
                throw new AGError("Student ID list is required.");
            }

            console.log(studentIDList.length)

            const studentData = await prisma.students.findMany({
                where: {
                    StudentID: {
                        in: studentIDList,
                    }
                },
                include: {
                    Parents: true,
                }
            })

            if (studentData.length !== studentIDList.length) {
                throw new AGError("Some students ID is invalid.");
            }

            const uploader = new AGUploader()

            const payload = c.get("jwtPayload");

            const uploaded: IUploadedMedia[] = [];

            const promises = []

            for (const [index, item] of providedImages.entries()) {
                const arrBuf = await (body[item as keyof typeof body] as Blob).arrayBuffer();

                // const worker = new Worker('./lib/controllers/dailylogs/worker.js', {
                //     workerData: {
                //         fileName: doLocation,
                //         file: new Uint8Array(arrBuf)
                //     }
                // });

                const mediaURL = `diaries/${DateTime.now().toISODate()}/shared/${
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

            // const userMediaState = ALLOWED_ACTIVE_DIARY.includes(body.category as string) 
            //     ? "active"
            //     : "inactive";

            const dbUploadData = await prisma.$transaction(uploaded.map((item) => prisma.aGMedia.create({
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
                    // MediaState: userMediaState,
                },
            })))

            const studentTransaction = await prisma.dailyLogs.create({
                data: {
                    Timestamp: DateTime.now().toJSDate(),
                    // Temperature: body.temperature
                    //     ? parseFloat(body.temperature as string)
                    //     : null,
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
                        connect: studentIDList.map((item) => ({
                            StudentID: item,
                        })),
                    },
                    // FStudentID: studentID,
                },
            });

            return c.json({
                success: true,
                message: "Diary uploaded successfully.",
                data: {}
            })


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

        
        // try {
            
        //     const body = await c.req.parseBody<DiaryUpload>();

        //     const keys = Object.keys(body);

        //     for(const[k, v] of Object.entries(body)) {

        //     }

        // } catch (err) {
        //     console.error(err);
        //     return c.json({
        //         message: "An error occurred",
        //         success: false,
        //     });
        // }
    }
)

export default uploadTagging;