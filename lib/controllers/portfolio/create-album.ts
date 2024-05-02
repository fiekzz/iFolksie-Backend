import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AGUploader } from "../../services/AGUploader";
import { compressImage } from "../../services/AGImageCompress";
import { settings } from "../../constants/global-settings";

const createAlbum = new Hono();

const ALLOWED_ROLES = ["administrator", "branch manager", "staff"];

const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

interface IUploadedMedia {
    mediaURL: string;
}

const zCreateAlbum = z.object({
    photo: z.any(),
    title: z.string(),
    // class: z.string(),
    subclass: z.string(),
});

type ICreateAlbum = z.infer<typeof zCreateAlbum>;

createAlbum.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("form", zCreateAlbum),
    async (c) => {
        try {
            const body = await c.req.parseBody<ICreateAlbum>();

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

            const photo = body["photo"] as Blob;

            const uploader = new AGUploader();

            const arr = new Uint8Array(await photo.arrayBuffer());

            const compressedArr = await compressImage({
                buffer: arr,
                width: 720,
                height: 720,
            });

            const mediaURL = `portfolio-album-cover/${
                payload.email
            }/${Date.now()}-${payload.sub}.webp`;

            const mediaUpload = await uploader.uploadToS3({
                file: compressedArr,
                fileName: mediaURL,
                publicACL: true,
            });

            await prisma.portfolioAlbum.create({
                data: {
                    AlbumCover: {
                        create: {
                            MediaURL: `${settings.cdnUrl}/${mediaURL}`,
                            MediaKey: mediaURL,
                            MediaType: "image-portfolioalbumcover",
                            MediaState: "active",
                            UploadedBy: {
                                connect: {
                                    UserID: payload.sub,
                                },
                            }
                        },
                    },
                    AlbumName: body.title,
                    // TODO SUBCATEGORY
                    AlbumSubcategory: {
                        connect: {
                            SubcategoryID: body.subclass,
                        },
                    },
                    AlbumDescription: "",
                },
            });

            return c.json(
                {
                    message: "Album created successfully",
                    success: true,
                    data: {},
                },
                201
            );

        } catch (err) {

            console.log(err);

            return c.json(
                {
                    message: err,
                    success: false,
                    data: {},
                },
                500
            );
        }
    }
);

createAlbum.get(
    "/get-info",
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

        const data = await prisma.subcategory.findMany()

        return c.json({
            message: "You are allowed to access this resource",
            success: true,
            data: data,
        });
    }
);

export default createAlbum;