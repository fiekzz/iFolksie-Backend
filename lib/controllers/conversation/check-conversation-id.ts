import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const checkConversationID = new Hono();

const zCheckConversation = z.object({
    conversationID: z.string(),
});

type ICheckConversation = z.infer<typeof zCheckConversation>;

checkConversationID.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("json", zCheckConversation),
    async (c) => {
        const body = await c.req.json<ICheckConversation>();

        const payload = c.get("jwtPayload");

        try {
            const data = await prisma.conversations.findFirst({
                where: {
                    ConversationID: body.conversationID
                },
                select: {
                    ConversationID: true,
                },
            });

            if (!data) {

                return c.json({
                    success: true,
                    message: "Conversation not found.",
                    data: {},
                }, 400);
            }

            return c.json({
                success: true,
                message: "Conversation found.",
                data: data,
            });
        } catch (error) {
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
);

export default checkConversationID;
