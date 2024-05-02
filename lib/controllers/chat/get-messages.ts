import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const getMessagesAPI = new Hono()

getMessagesAPI.get(
    "/:conversationID",
    jwt({
        secret: process.env.JWT_SECRET!
    }),
    async (c) => {

        const payload = c.get("jwtPayload");

        try {

            const data = await prisma.messages.findMany({
                where: {
                    Conversations: {
                        ConversationID: c.req.param('conversationID')
                    }
                }
            })

            return c.json({
                data,
                message: "Successfully fetched messages",
                success: true
            });
            
        }  catch (error) {
            console.log(error);

            return c.json(
                {
                    success: false,
                    message:
                        (error as Error)?.message ?? "Something went wrong.",
                    data: {},
                },
                500
            );
        }

    }
)

export default getMessagesAPI