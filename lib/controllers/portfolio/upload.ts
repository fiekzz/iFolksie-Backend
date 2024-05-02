import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { AGUploader } from "../../services/AGUploader";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { nanoid } from "nanoid";
import { convertWebp } from "../../services/AGImageCompress";
import { settings } from "../../constants/global-settings";

const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const ACCEPTED_VIDEO_TYPES = [
    "video/mp4",
    // "video/webm",
    "video/quicktime",
    // "video/3gpp",
    // "video/x-msvideo",
    // "video/x-flv",
    // "video/3gpp2",
    // "video/x-ms-wmv",
    // "video/avi",
    // "video/x-matroska",
    // "video/x-ms-asf",
    // "video/x-mpeg",
    // "video/x-msvideo",
    // "video/ogg"
]

interface IUploadedMedia {
    mediaURL: string;
    fileType: 'image' | 'video'
}

class AGError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AGError";
    }
}

const createMemoriesAPI = new Hono();

const zMemoriesUploadTypes = z.object({
    image0: z.any(),
    image1: z.any(),
    image2: z.any(),
    image3: z.any(),
    image4: z.any(),
    video0: z.any(),
    description: z.string(),
    studentIDs: z.string().transform((str, ctx) => {
        try {
            const data = JSON.parse(str);

            if (Array.isArray(data)) {
                return data;
            } else {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid JSON received. Do not supply object.",
                });
                return z.NEVER;
            }
        } catch (error) {
            ctx.addIssue({ code: "custom", message: "Invalid JSON received." });
            return z.NEVER;
        }
    }), // JSON !!,
    classIDs: z.string().transform((str, ctx) => {
        try {
            const data = JSON.parse(str);

            if (Array.isArray(data)) {
                return data;
            } else {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid JSON received. Do not supply object.",
                });
                return z.NEVER;
            }
        } catch (error) {
            ctx.addIssue({ code: "custom", message: "Invalid JSON received." });
            return z.NEVER;
        }
    }), // JSON !!,
    albumID: z.string(),
});

export interface ImageStudentsTag {
    imageNo: number;
    studentIDs: string[];
}

/* 
[{
    imageNo: 0,
    studentIDs: ["SwYLUn7-kYMZOfvDN15NvdQ7tcpvdC99", "Qgq4v8VDCZbDsgKZ8_wPHC4XsNSyivur"]
}, {
    imageNo: 0,
    studentIDs: ["Qgq4v8VDCZbDsgKZ8_wPHC4XsNSyivur"]
}]

*/

// interface of array of ImageStudentsTag interface
// interface ImageStudentsTagArray extends Array<ImageStudentsTag> {}

const zMemoriesUploadTypesV2 = z.object({
    image0: z.any(),
    image1: z.any().optional(),
    image2: z.any().optional(),
    image3: z.any().optional(),
    image4: z.any().optional(),
    video0: z.any().optional(),
    video1: z.any().optional(),
    video2: z.any().optional(),
    video3: z.any().optional(),
    video4: z.any().optional(),
    studentIDs: z.string().transform((str, ctx) => {
        try {
            const data = JSON.parse(str) as Array<ImageStudentsTag>;

            if (Array.isArray(data)) {
                // console.log(data);

                return data;
            } else {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid JSON received. Do not supply object.",
                });
                return z.NEVER;
            }
        } catch (err) {
            ctx.addIssue({
                code: "custom",
                message: "Invalid JSON received. HAA",
            });
            return z.NEVER;
        }
    }),
    description: z.string(),
    albumID: z.string(),
    classIDs: z.string().transform((str, ctx) => {
        try {
            const data = JSON.parse(str);
            
            // return data;

            if (Array.isArray(data)) {
                console.log(data)
                return data;
            } else {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid JSON received. Do not supply object.",
                });
                return z.NEVER;
            }
        } catch (error) {

            ctx.addIssue({
                code: "custom",
                message: "Invalid JSON received. HAAA",
            });
            return z.NEVER;
        }
    }), // JSON !!,
});

// create interface based on the zod schema
interface MemoriesUploadTypesV2
    extends z.infer<typeof zMemoriesUploadTypesV2> {}

createMemoriesAPI.post(
    "/v2",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("form", zMemoriesUploadTypesV2),
    async (c) => {
        try {
            const body = await c.req.parseBody();

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
                }
                else if (k.startsWith('video')) {

                    if (!/video[0-4]$/g.test(k)) {
                        throw new AGError(
                            "Too many images or invalid image argument received."
                        );
                    }

                    // const fileType = (v as File).type;

                    // console.log(v);
                    // console.log(fileType);
                    // console.log(JSON.stringify(v));

                    // if (!fileType) {
                    //     throw new AGError(`${k} argument must be a file.`);
                    // }

                    // if (!ACCEPTED_VIDEO_TYPES.includes(fileType)) {
                    //     throw new AGError(
                    //         `${k}: Invalid file type received: (${fileType})`
                    //     );
                    // }

                }                
                else if (typeof v !== "string") {
                    throw new AGError("Invalid payload argument received.");
                }
            }

            const providedImages = keys.filter((item) =>
                item.startsWith("image")
            );

            const providedVideo = keys.filter((item) =>
                item.startsWith("video")
            );

            if (providedImages.length === 0 && providedVideo.length === 0) {
                throw new AGError("No images received. Memories must have images.");
            }

            const studentIDsWithImageNo = JSON.parse(
                body.studentIDs as string
            ) as Array<ImageStudentsTag>;

            const classIDs = JSON.parse(body.classIDs as string) as string[];

            // const [studentsCheck, classesCheck] = await prisma.$transaction([
            //     prisma.students.findMany({
            //         where: {
            //             StudentID: {
            //                 in: studentIDs
            //                     .map((item) => item.studentIDs)
            //                     .flat(),
            //             },
            //         },
            //     }),
            //     prisma.aGClasses.findMany({
            //         where: {
            //             ClassID: {
            //                 in: classIDs,
            //             },
            //         },
            //     }),
            // ]);

            const studentsCheck = await prisma.students.findMany({
                where: {
                    StudentID: {
                        in: studentIDsWithImageNo.map((item) => item.studentIDs).flat(),
                    },
                },
            });

            const providedStudentIDs = new Set(studentIDsWithImageNo.map((item) => item.studentIDs).flat());

            if (studentsCheck.length !== providedStudentIDs.size) {
                throw new AGError("There are student ID(s) which are invalid.");
            }

            // if (classesCheck.length !== classIDs.length) {
            //     throw new AGError("There are class ID(s) which are invalid.");
            // }

            // const classID = body.classID as string;
            const albumID = body.albumID as string;

            // const [albumDetails] = await prisma.$transaction([
            //     // prisma.aGClasses.findFirst({
            //     //     where: {
            //     //         ClassID: classID,
            //     //     },
            //     //     select: {
            //     //         ClassName: true,
            //     //         Branch: {
            //     //             select: {
            //     //                 BranchName: true,
            //     //                 Category: {
            //     //                     select: {
            //     //                         Organization: {
            //     //                             select: {
            //     //                                 OrgName: true,
            //     //                             },
            //     //                         },
            //     //                     },
            //     //                 },
            //     //             },
            //     //         },
            //     //     },
            //     // }),
            //     prisma.portfolioAlbum.findFirst({
            //         where: {
            //             AlbumID: albumID,
            //         },
            //         select: {
            //             AlbumName: true,
            //             AlbumSubcategory: {
            //                 select: {
            //                     SubcategoryName: true,
            //                 },
            //             },
            //         },
            //     }),
            // ]);

            const albumDetails = await prisma.portfolioAlbum.findFirst({
                where: {
                    AlbumID: albumID,
                },
                select: {
                    AlbumName: true,
                    AlbumSubcategory: {
                        select: {
                            SubcategoryName: true,
                        },
                    },
                },
            });

            console.log(`ALBUM ID: ${albumID}`)

            // if (!branchIDByClass || !branchIDByClass.Branch) {
            //     throw new AGError("Class not found.");
            // }

            const uploader = new AGUploader();

            const payload = c.get("jwtPayload");

            const promises = [];

            const uploaded: IUploadedMedia[] = [];

            for (const [index, item] of providedImages.entries()) {
                const arrBuf = await (body[item] as Blob).arrayBuffer();

                // memories/AGVenture-Putrajaya/Infant/Feb2024/abc123-EarlyCommunication/abc123.webp

                // memories/[Org-Branch]/[ClassName]/Date/[AlbumTitle]/[04-02-2024|4pm-ImageID].webp

                // const mediaURL = `memories/${DateTime.now().toFormat(
                //     "MMM-yyyy"
                // )}/${albumDetails?.AlbumName.replaceAll(
                //     " ",
                //     ""
                // )}/${DateTime.now().toISO()}-${nanoid(16)}.webp`;

                const mediaURL = `memories/${DateTime.now().toFormat(
                    "MMM-yyyy"
                )}/${albumDetails?.AlbumName.replaceAll(
                    " ",
                    ""
                )}/${DateTime.now().toISO()}-${nanoid(16)}.webp`;

                const compressedArr = await convertWebp({
                    buffer: new Uint8Array(arrBuf),
                    quality: 85,
                });

                uploaded.push({
                    mediaURL: mediaURL,
                    fileType: 'image'
                });

                promises.push(
                    uploader.uploadToS3({
                        file: compressedArr,
                        fileName: mediaURL,
                        publicACL: true,
                    })
                );
            }

            for (const [index, item] of providedVideo.entries()) {
            
                const arrBuf = await (body[item] as Blob).arrayBuffer();

                const mediaURL = `memories/${DateTime.now().toFormat(
                    "MMM-yyyy"
                )}/${albumDetails?.AlbumName.replaceAll(
                    " ",
                    ""
                )}/${DateTime.now().toISO()}-${nanoid(16)}.mp4`;

                uploaded.push({
                    mediaURL: mediaURL,
                    fileType: 'video'
                });

                promises.push(
                    uploader.uploadToS3({
                        file: new Uint8Array(arrBuf),
                        fileName: mediaURL,
                        publicACL: true,
                        contentType: 'video/mp4'
                    })
                );
            
            }

            const data = await Promise.all(promises);

            const dbUploadData = await prisma.$transaction(
                uploaded.map((item, index) =>
                    prisma.aGMedia.create({
                        data: {
                            MediaType: item.fileType === 'image' ? "image-memories" : "video-memories",
                            MediaURL: `${settings.cdnUrl}/${item.mediaURL}`,
                            MediaKey: item.mediaURL,
                            UploadedBy: {
                                connect: {
                                    UserID: payload.sub,
                                },
                            },
                            TaggedStudents: {
                                // connect: studentIDs
                                //     .map((item) => item.studentIDs)
                                //     .flat()
                                //     .map((item) => ({
                                //         StudentID: item,
                                //     })),
                                connect: studentIDsWithImageNo[index].studentIDs.map(item => {
                                    return {
                                        StudentID: item
                                    }
                                })
                            },
                        },
                    })
                )
            );

            const studentIDs: string[] = []

            for (const item of studentIDsWithImageNo) {
                studentIDs.push(...item.studentIDs)
            }

            const studentTransaction = await prisma.portfolio.create({
                data: {
                    Medias: {
                        connect: dbUploadData.map((item) => ({
                            MediaID: item.MediaID,
                        })),
                    },
                    Description: body.description as string,
                    // Students: {
                    //     connect: studentIDs.map((item) => ({
                    //         StudentID: item.studentIDs.map((item) => {

                    //         }),
                    //     })),
                    // },
                    Students: {
                        connect: studentIDs.map((item) => ({
                            StudentID: item
                        })),
                    },
                    Teachers: {
                        connect: {
                            UserID: payload.sub,
                        },
                    },
                    PortfolioAlbum: {
                        connect: {
                            AlbumID: albumID,
                        },
                    },
                    TaggedClasses: {
                        connect: classIDs.map((item) => ({
                            ClassID: item,
                        })),
                    },
                },
            });

            return c.json({
                success: true,
                message: `Memories for ${studentIDsWithImageNo.length} students has been created successfully.`,
                data: {
                    // student: studentTransaction,
                },
            });
        } catch (err) {
            if (err instanceof AGError) {
                return c.json(
                    {
                        message: err.message,
                        success: false,
                        data: {},
                    },
                    400
                );
            } else {
                console.log(err);

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
);

// TODO: CHECK IF THE CLASS AND ALBUM EXISTS
// TODO: CHECK IF STUDENT EXISTS
// TODO: CHECK IF STUDENT IN RIGHT CLASS AND BRANCH

createMemoriesAPI.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("form", zMemoriesUploadTypes),
    async (c) => {
        try {
            const body = await c.req.parseBody();

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
                } else if (k.startsWith('video')) {

                    if (!/video[0-4]$/g.test(k)) {
                        throw new AGError(
                            "Too many images or invalid image argument received."
                        );
                    }

                    const fileType = (v as File).type;

                    if (!fileType) {
                        throw new AGError(`${k} argument must be a file.`);
                    }

                    if (!ACCEPTED_VIDEO_TYPES.includes(fileType)) {
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

            const providedVideo = keys.filter((item) =>
                item.startsWith("video")
            );

            if (providedImages.length === 0 && providedVideo.length === 0) {
                throw new AGError("No images received. Memories must have images.");
            }

            const studentIDs = JSON.parse(
                body.studentIDs as string
            ) as string[];

            const classIDs = JSON.parse(body.classIDs as string) as string[];

            const [studentsCheck, classesCheck] = await prisma.$transaction([
                prisma.students.findMany({
                    where: {
                        StudentID: {
                            in: studentIDs,
                        },
                    },
                }),
                prisma.aGClasses.findMany({
                    where: {
                        ClassID: {
                            in: classIDs,
                        },
                    },
                }),
            ]);

            if (studentsCheck.length !== studentIDs.length) {
                throw new AGError("There are student ID(s) which are invalid.");
            }

            if (classesCheck.length !== classIDs.length) {
                throw new AGError("There are class ID(s) which are invalid.");
            }

            const classID = body.classID as string;
            const albumID = body.albumID as string;

            const [branchIDByClass, albumDetails] = await prisma.$transaction([
                prisma.aGClasses.findFirst({
                    where: {
                        ClassID: classID,
                    },
                    select: {
                        ClassName: true,
                        Branch: {
                            select: {
                                BranchName: true,
                                Category: {
                                    select: {
                                        Organization: {
                                            select: {
                                                OrgName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                }),
                prisma.portfolioAlbum.findFirst({
                    where: {
                        AlbumID: albumID,
                    },
                    select: {
                        AlbumName: true,
                        AlbumSubcategory: {
                            select: {
                                SubcategoryName: true,
                            },
                        },
                    },
                }),
            ]);

            if (!branchIDByClass || !branchIDByClass.Branch) {
                throw new AGError("Class not found.");
            }

            const uploader = new AGUploader();

            const payload = c.get("jwtPayload");

            const promises = [];
            const uploaded: IUploadedMedia[] = [];

            for (const [index, item] of providedImages.entries()) {
                const arrBuf = await (body[item] as Blob).arrayBuffer();

                // memories/AGVenture-Putrajaya/Infant/Feb2024/abc123-EarlyCommunication/abc123.webp

                // memories/[Org-Branch]/[ClassName]/Date/[AlbumTitle]/[04-02-2024|4pm-ImageID].webp

                const mediaURL = `memories/${branchIDByClass.Branch!.Category.Organization.OrgName.replaceAll(
                    " ",
                    ""
                )}-${branchIDByClass.Branch!.BranchName.replaceAll(
                    " ",
                    ""
                )}/${albumDetails?.AlbumSubcategory.SubcategoryName.replaceAll(
                    " ",
                    ""
                )}-${branchIDByClass.ClassName.replaceAll(
                    " ",
                    ""
                )}/${DateTime.now().toFormat(
                    "MMM-yyyy"
                )}/${albumDetails?.AlbumName.replaceAll(
                    " ",
                    ""
                )}/${DateTime.now().toISO()}-${nanoid(16)}.webp`;

                const compressedArr = await convertWebp({
                    buffer: new Uint8Array(arrBuf),
                    quality: 85,
                });

                uploaded.push({
                    mediaURL: mediaURL,
                    fileType: 'image'
                });

                promises.push(
                    uploader.uploadToS3({
                        file: compressedArr,
                        fileName: mediaURL,
                        publicACL: true,
                    })
                );
            }

            for (const [index, item] of providedVideo.entries()) {
            
                const arrBuf = await (body[item] as Blob).arrayBuffer();

                const mediaURL = `memories/${branchIDByClass.Branch!.Category.Organization.OrgName.replaceAll(
                    " ",
                    ""
                )}-${branchIDByClass.Branch!.BranchName.replaceAll(
                    " ",
                    ""
                )}/${albumDetails?.AlbumSubcategory.SubcategoryName.replaceAll(
                    " ",
                    ""
                )}-${branchIDByClass.ClassName.replaceAll(
                    " ",
                    ""
                )}/${DateTime.now().toFormat(
                    "MMM-yyyy"
                )}/${albumDetails?.AlbumName.replaceAll(
                    " ",
                    ""
                )}/${DateTime.now().toISO()}-${nanoid(16)}.mp4`;

                uploaded.push({
                    mediaURL: mediaURL,
                    fileType: 'video'
                });

                promises.push(
                    uploader.uploadToS3({
                        file: new Uint8Array(arrBuf),
                        fileName: mediaURL,
                        publicACL: true,
                        contentType: 'video/mp4'
                    })
                );
            
            }

            const data = await Promise.all(promises);

            const dbUploadData = await prisma.$transaction(
                uploaded.map((item) =>
                    prisma.aGMedia.create({
                        data: {
                            MediaType: item.fileType === 'image' ? "image-memories" : "video-memories",
                            MediaURL: `${settings.cdnUrl}/${item.mediaURL}`,
                            MediaKey: item.mediaURL,
                            UploadedBy: {
                                connect: {
                                    UserID: payload.sub,
                                },
                            },
                        },
                    })
                )
            );

            const studentTransaction = await prisma.portfolio.create({
                data: {
                    Medias: {
                        connect: dbUploadData.map((item) => ({
                            MediaID: item.MediaID,
                        })),
                    },
                    Description: body.description as string,
                    Students: {
                        connect: studentIDs.map((item) => ({
                            StudentID: item,
                        })),
                    },
                    Teachers: {
                        connect: {
                            UserID: payload.sub,
                        },
                    },
                    PortfolioAlbum: {
                        connect: {
                            AlbumID: albumID,
                        },
                    },
                    TaggedClasses: {
                        connect: classIDs.map((item) => ({
                            ClassID: item,
                        })),
                    },
                },
            });

            return c.json({
                success: true,
                message: `Memories for ${studentIDs.length} students has been created successfully.`,
                data: {
                    // student: studentTransaction,
                },
            });
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

export default createMemoriesAPI;
