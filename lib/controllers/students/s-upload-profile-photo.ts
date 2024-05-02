import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AGUploader } from "../../services/AGUploader";
import { compressImage } from "../../services/AGImageCompress";
import { prisma } from "../../app/prisma";
import { settings } from "../../constants/global-settings";

const studentUploadProfilePhoto = new Hono();

const zStudentProfilePhoto = z.object({
    photo: z.any(),
    studentId: z.string(),
});

const ALLOWED_ROLES = ["administrator", "branch manager"];

studentUploadProfilePhoto.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("form", zStudentProfilePhoto),
    async (c) => {
        
        try {
            const payload = c.get("jwtPayload");
    
            const role = payload["role"] as string[];
    
            const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r));

            if (!isAllowed) {
                return c.json({
                    message: "You are not allowed to access this resource",
                    success: false,
                    data: {},
                }, 401);
            }

            const body = await c.req.parseBody() as z.infer<typeof zStudentProfilePhoto>;

            const photo = body["photo"] as Blob;

            const uploader = new AGUploader();

            const arr = new Uint8Array(await photo.arrayBuffer());

            const compressedArr = await compressImage({ buffer: arr, width: 720, height: 720 });

            const previousData = await prisma.students.findFirst({
                where: {
                    StudentID: body.studentId,
                },
                select: {
                    PictureURL: {
                        select: {
                            MediaURL: true,
                            MediaKey: true,
                            UploadedAt: true,
                        }
                    }
                }
            })

            if (previousData?.PictureURL) {
                const deleteData = await uploader.deleteObjectFromS3({
                    keys: [previousData.PictureURL.MediaKey],
                });

                console.log(deleteData.Deleted);
            }

            const mediaURL = `profile-photos/${
                body.studentId
            }/${new Date().toISOString()}-${payload.sub}.webp`;

            const mediaUpload = await uploader.uploadToS3({
                file: compressedArr,
                fileName: mediaURL,
                publicACL: true,
            });

            const data = await prisma.students.update({
                where: {
                    StudentID: body.studentId,
                },
                data: {
                    PictureURL: {
                        create: {
                            MediaType: "image-studentpicture",
                            MediaURL: `${settings.cdnUrl}/${mediaURL}`,
                            MediaKey: mediaURL,
                            MediaState: "ACTIVE",
                            UploadedBy: {
                                connect: {
                                    UserID: payload.sub,
                                },
                            }
                        }
                    }
                }
            })

            return c.json({
                message: "Profile photo uploaded successfully",
                data: data,
                success: true,
            });

        } catch (error) {

            console.log(error);

            return c.json({
                message: "Internal server error",
                success: false,
                data: {},
            }, 500);
        }
    }
);

export default studentUploadProfilePhoto;