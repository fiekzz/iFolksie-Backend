import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { AGUploader } from "../../services/AGUploader";
import { zValidator } from "@hono/zod-validator";
import { compressImage } from "../../services/AGImageCompress";
import { settings } from "../../constants/global-settings";

interface IChangePortfolioName {
    memoryId: string;
    newName: string;
}

const ALLOWED_ROLES = ["administrator"];

const editPortfolio = new Hono();

editPortfolio.post(
    "/name",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        const role = payload["role"] as string[];

        const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r));

        if (!isAllowed) {
            return c.json(
                {
                    message: "You are not allowed to access this resource",
                    success: false,
                    data: {},
                },
                401
            );
        }

        const body = await c.req.json() as IChangePortfolioName;

        try {
            await prisma.portfolioAlbum.update({
                where: {
                    AlbumID: body.memoryId,
                },
                data: {
                    AlbumName: body.newName,
                },
            });

            return c.json({
                message: "Memory name updated successfully",
                data: {},
                success: true,
            });
        } catch (error) {
            console.log(error);

            return c.json(
                {
                    message: "Internal server error",
                    success: false,
                    data: {},
                },
                500
            );
        }
    }
);

const zAlbumCover = z.object({
    photo: z.any(),
    albumId: z.string(),
});


editPortfolio.post(
    "/albumcover",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("form", zAlbumCover),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            const role = payload["role"] as string[]

            const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r))

            if (!isAllowed) {
                return c.json({
                    message: "You are not allowed to access this resource",
                    success: false,
                    data: {},
                }, 401)
            }

            const body = await c.req.parseBody()

            const photo = body["photo"] as Blob
            
            const uploader = new AGUploader()

            const arr = new Uint8Array(await photo.arrayBuffer())

            const compressedArr = await compressImage({ buffer: arr, width: 720, height: 720 })

            const previousPic = await prisma.portfolioAlbum.findFirst({
                where: {
                    AlbumID: body["albumId"] as string,
                },
                select: {
                    AlbumCover: {
                        select: {
                            MediaID: true,
                            MediaURL: true,
                            MediaKey: true,
                        },
                    },
                },
            })

            if (previousPic?.AlbumCover) {
                const deleteData = await uploader.deleteObjectFromS3({
                    keys: [previousPic.AlbumCover.MediaKey],
                })

                console.log(deleteData.Deleted)
            }

            const mediaURL = `portfolio-album-cover/${
                payload.email
            }/${Date.now()}-${payload.sub}.webp`

            const mediaUpload = await uploader.uploadToS3({
                file: compressedArr,
                fileName: mediaURL,
                publicACL: true,
            })

            await prisma.portfolioAlbum.update({
                where: {
                    AlbumID: body["albumId"] as string,
                },
                data: {
                    AlbumCover: {
                        create: {
                            MediaType: "image-portfolioalbumcover",
                            MediaURL: `${settings.cdnUrl}/${mediaURL}`,
                            MediaKey: mediaURL,
                            UploadedBy: {
                                connect: {
                                    UserID: payload.sub,
                                }
                            },
                            MediaState: "ACTIVE",
                        },
                    },
                },
            })

            return c.json({
                message: "Album cover updated successfully",
                data: {},
                success: true,
            })

        } catch (error) {

            console.log(error)

            return c.json({
                message: "Internal server error",
                success: false,
                data: {},
            }, 500)
        }
    }
);

export default editPortfolio;