import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const checkOrCreateConversation = new Hono();

const zCheckConversation = z.object({
    userID: z.string(),
});

type ICheckConversation = z.infer<typeof zCheckConversation>;

checkOrCreateConversation.post(
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
                    Users: {
                        some: {
                            OR: [
                                {
                                    UserID: payload.sub,
                                },
                                {
                                    UserID: body.userID,
                                },
                            ],
                        },
                    },
                },
                select: {
                    ConversationID: true,
                    Users: {
                        select: {
                            UserID: true,
                            FullName: true,
                            MobileNumber: true,
                            EmailAddress: true,
                            ProfilePicture: {
                                select: {
                                    MediaURL: true
                                }
                            }
                        }
                    }
                },
            });

            if (!data) {

                const createConversation = await prisma.conversations.create({
                    data: {
                        Users: {
                            connect: [
                                {
                                    UserID: payload.sub,
                                },
                                {
                                    UserID: body.userID
                                }
                            ]
                        }
                    },
                    select: {
                        ConversationID: true,
                        Users: {
                            select: {
                                UserID: true,
                                FullName: true,
                                MobileNumber: true,
                                EmailAddress: true,
                                ProfilePicture: {
                                    select: {
                                        MediaURL: true
                                    }
                                }
                            }
                        }
                    },
                });

                return c.json({
                    success: true,
                    message: "Created a new conversation",
                    data: createConversation,
                });
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

export default checkOrCreateConversation;
