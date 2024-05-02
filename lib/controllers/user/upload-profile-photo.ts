import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AGUploader } from "../../services/AGUploader";
import { DateTime } from "luxon";
import { compressImage } from "../../services/AGImageCompress";
import { settings } from "../../constants/global-settings";

const uploadProfilePhoto = new Hono();

const zProfilePhoto = z.object({
    photo: z.any(),
});

uploadProfilePhoto.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("form", zProfilePhoto),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            const body = await c.req.parseBody();

            const photo = body["photo"] as Blob;

            const uploader = new AGUploader();

            const arr = new Uint8Array(await photo.arrayBuffer());

            const compressedArr = await compressImage({ buffer: arr, width: 720, height: 720 });

            const previousData = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    ProfilePicture: {
                        select: {
                            MediaURL: true,
                            MediaKey: true,
                            UploadedAt: true,
                        },
                    },
                },
            });

            if (previousData?.ProfilePicture) {
                const deleteData = await uploader.deleteObjectFromS3({
                    keys: [previousData.ProfilePicture.MediaKey],
                });

                console.log(deleteData.Deleted);
            }

            const mediaURL = `profile-photos/${
                payload.email
            }/${DateTime.now().toISO()}-${payload.sub}.webp`

            const mediaUpload = await uploader.uploadToS3({
                file: compressedArr,
                fileName: mediaURL,
                publicACL: true,
            });

            const data = await prisma.users.update({
                where: {
                    UserID: payload.sub,
                },
                data: {
                    ProfilePicture: {
                        create: {
                            MediaType: "image-profilepicture",
                            MediaURL: `${settings.cdnUrl}/${mediaURL}`,
                            MediaKey: mediaURL,
                            FUserID: payload.sub,
                            MediaState: "ACTIVE",
                        },
                    },
                },
            });

            return c.json({
                success: true,
                data: {},
                message:
                    "Updated profile photo for " +
                    payload.email +
                    " uploaded successfully",
            });
        } catch (error) {
            console.log(error);

            return c.json({
                message: "Something went wrong",
                data: {
                    error:
                        (error as Error)?.message ?? "Internal error occurred",
                },
                success: false,
            });
        }
    }
);

uploadProfilePhoto.delete(
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        try {
            const uploader = new AGUploader()

            const payload = c.get("jwtPayload");

            const previousData = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    ProfilePicture: {
                        select: {
                            MediaURL: true,
                            MediaKey: true,
                            UploadedAt: true,
                        },
                    },
                },
            });

            if (previousData?.ProfilePicture) {
                const deleteData = await uploader.deleteObjectFromS3({
                    keys: [previousData.ProfilePicture.MediaKey],
                });

                console.log(deleteData.Deleted);

                await prisma.users.update({
                    where: {
                        UserID: payload.sub,
                    },
                    data: {
                        ProfilePicture: {
                            delete: true
                        }
                    }
                })

                return c.json({
                    success: true,
                    data: {},
                    message:
                        "Deleted profile photo for " +
                        payload.email +
                        " successfully.",
                });

            }
            else {
                return c.json({
                    success: true,
                    data: {},
                    message:
                        "No profile photo for " +
                        payload.email +
                        " found.",
                });
            }

        } catch (error) {

            console.log(error);

            return c.json({
                message: "Something went wrong",
                data: {
                    error:
                        (error as Error)?.message ?? "Internal error occurred",
                },
                success: false,
            })

        }
    }
);

export default uploadProfilePhoto;
