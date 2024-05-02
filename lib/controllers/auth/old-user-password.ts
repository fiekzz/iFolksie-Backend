import { z } from "zod";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../../app/prisma";
import { AGMailer } from "../../services/AGMailer";
import { settings } from "../../constants/global-settings";
import { decode, jwt, sign, verify } from "hono/jwt";
// import argon2 from 'argon2'
import { getRuntimeKey } from "hono/adapter";

const s2meUserPassword = new Hono();

s2meUserPassword.use(
    cors({
        allowMethods: ["POST"],
        origin: "*",
    })
);

const zOldUserPasswordType = z.object({
    password: z.string(),
    token: z.string(),
});

type OldUserPasswordType = z.infer<typeof zOldUserPasswordType>;

s2meUserPassword.post(
    "/",
    zValidator("json", zOldUserPasswordType),
    async (c) => {
        const payload = await c.req.json<OldUserPasswordType>();

        try {
            const decodedPayload = await verify(
                payload.token,
                process.env.EMAIL_REGISTRATION_SECRET!
            );

            const user = await prisma.users.findFirst({
                where: {
                    UserID: decodedPayload.sub,
                    UsersAuth: null,
                },
                include: {
                    Role: true
                }
            });

            if (!user) {
                return c.json(
                    {
                        message: `Uh oh, we could not find your account. Please contact us at ${settings.contactEmail}. Perhaps you have already migrated your account?`,
                        errorcode: "USER_NOT_FOUND",
                    },
                    400
                );
            }

            let hashed: string;

            // if (getRuntimeKey() === 'bun') {
                hashed = await Bun.password.hash(payload.password);
            // }
            // else {
            //     hashed = await argon2.hash(payload.password);
            // }

            await prisma.users.update({
                where: {
                    UserID: user.UserID,
                },
                data: {
                    EmailAddress: decodedPayload.email,
                    Status: "Registered",
                    UsersAuth: {
                        create: {
                            Password: hashed,
                        },
                    },
                },
            });

            return c.json({
                message:
                    "Registration successful! You can now login to your account.",
            });
        } catch (error) {

            console.log(error);

            return c.json({
                message:
                    "Oops, invalid token received. Please try again.",
                errorcode: "INVALID_TOKEN",
            }, 401);

        }
    }
);

export { s2meUserPassword };
