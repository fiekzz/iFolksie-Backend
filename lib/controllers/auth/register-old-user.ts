import { z } from "zod";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../../app/prisma";
import { AGMailer } from "../../services/AGMailer";
import { settings } from "../../constants/global-settings";
import { sign } from 'hono/jwt'

const oldUserRegisterAuthAPI = new Hono();

const zRegistrationTypes = z.object({
    emailAddress: z.string().email(),
    phone: z.string().startsWith('+').min(10),
});

type IRegistrationTypes = z.infer<typeof zRegistrationTypes>;

oldUserRegisterAuthAPI.post(
    "/",
    zValidator("json", zRegistrationTypes),
    async (c) => {
        const payload = await c.req.json<IRegistrationTypes>();

        try {
            
            const user = await prisma.users.findFirst(
                {
                    where: {
                        MobileNumber: payload.phone,
                        UsersAuth: null,
                    }
                }
            )

            if (user) {

                const mailer = new AGMailer();

                const migrationToken = await sign({
                    sub: user.UserID,
                    email: payload.emailAddress,
                    role: 'migrate-user',
                    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
                }, process.env.EMAIL_REGISTRATION_SECRET!) 

                await mailer.sendMigrationEmail({
                    fullName: user.FullName,
                    phone: payload.phone,
                    email: payload.emailAddress,
                    verificationLink: settings.websiteUrl + '/auth/migrate-user?token=' + migrationToken,
                    contactEmail: settings.contactEmail
                })

                return c.json({
                    message: 'We have sent you an email with a link to migrate your account. Kindly check your email inbox.',
                }, 200)
            }
            else {

                return c.json({
                    message: 'Uh oh, we couldn\'t find a user with that email address. Please try again with other email address.',
                    errorcode: 'USER_NOT_FOUND'
                }, 404)

            }


        } catch (error) {

            console.log(error);
            
            return c.json({
                message: 'Oops, something went wrong. If problem persists, please contact support.',
                errorcode: 'REGISTRATION_ERROR'
            }, 500)

        }
    }
);

export { oldUserRegisterAuthAPI }
