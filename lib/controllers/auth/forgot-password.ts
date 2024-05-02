import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { zForgotPasswordTypes, IForgotPasswordTypes } from "./types/forgot-password-types";
import { prisma } from "../../app/prisma";
import { AGMailer } from "../../services/AGMailer";

const forgotPasswordAuthAPI = new Hono();

forgotPasswordAuthAPI.post("/", zValidator("json", zForgotPasswordTypes), async (c) => {

    const payload = await c.req.json<IForgotPasswordTypes>()

    try {
        
        const data = await prisma.users.findFirst({
            where: {
                EmailAddress: payload.email,
            },
            select: {
                UserID: true,
                EmailAddress: true,
                FullName: true,
            }
        })

        if (!data) {
            return c.json({
                data: {},
                message: 'Uh oh, you are not registered in our database. Contact Alti Genius support for more info',
                success: false,
            })
        }

        const mailer = new AGMailer()

        // mailer.

        return c.json({
            data: {},
            message: '',
        })

    } catch (error) {

        return c.json({
            message: 'TODO'
        }, 500)
        
    }


})

export default forgotPasswordAuthAPI