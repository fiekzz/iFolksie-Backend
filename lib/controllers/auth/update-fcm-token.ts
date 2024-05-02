import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { prisma } from "../../app/prisma";

const updateFCMToken = new Hono();

const zUpdateFCMToken = z.object({
    token: z.string(),
});

type IUpdateFCMToken = z.infer<typeof zUpdateFCMToken>;

updateFCMToken.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("json", zUpdateFCMToken),
    async (c) => {
        try {
            const payload = c.get("jwtPayload");

            const { token } = await c.req.json<IUpdateFCMToken>();

            const data = await prisma.usersAuth.update({
                where: {
                    UserID: payload.sub,
                },
                data: {
                    FCMToken: token,
                },
            });

            // Do something with the token

            return c.json({
                message: "FCM Token updated successfully",
                success: true,
                data: {},
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

export default updateFCMToken;
