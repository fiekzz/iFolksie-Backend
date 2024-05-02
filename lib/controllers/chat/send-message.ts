import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { prisma } from "../../app/prisma";
import FCMService from "../../services/FCMService";
import RTDBService from "../../services/RTDBService";
import { nanoid } from "nanoid";

const sendMessageAPI = new Hono();

const zSendMessage = z.object({
    key: z.string().optional(),
    message: z.string().optional(),
    metadata: z.any(),
    medias: z.array(z.string()).optional(),
    event: z.enum(["MESSAGE", "TYPING", "ACK"]),
});

type ISendMessage = z.infer<typeof zSendMessage>;

sendMessageAPI.post(
    "/send/:conversationID",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("json", zSendMessage),
    async (c) => {
        const payload = c.get("jwtPayload");

        const convID = c.req.param("conversationID");

        const { message, medias, event, metadata, key } =
            await c.req.json<ISendMessage>();

        // Check for param ID validity
        try {
            const data = await prisma.conversations.findFirst({
                where: {
                    ConversationID: convID,
                },
            });

            if (!data) {
                return c.json(
                    {
                        success: false,
                        message: "Invalid conversation ID",
                        data: {},
                    },
                    400
                );
            }
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

        try {
            if (event === "MESSAGE") {
                // 1. Save the message into DB
                const data = await prisma.messages.create({
                    data: {
                        MessageContent: message!,
                        MessageReference: JSON.stringify({
                            medias,
                            metadata,
                        }),
                        MessageClientID: key,
                        Users: {
                            connect: {
                                UserID: payload.sub,
                            },
                        },
                        Conversations: {
                            connect: {
                                ConversationID: convID,
                            },
                        },
                    },
                    select: {
                        Conversations: {
                            select: {
                                Users: {
                                    select: {
                                        UsersAuth: {
                                            select: {
                                                FCMToken: true,
                                            },
                                        },
                                        FullName: true,
                                        UserID: true,
                                        ProfilePicture: {
                                            select: {
                                                MediaURL: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });

                // 2. Broadcast the message to the conversation's realtime channel
                await RTDBService.sendRTMessage(
                    nanoid(16),
                    message!,
                    payload.sub,
                    convID,
                    (medias ?? []).length > 0 ? medias : [],
                    metadata
                );

                // 3. Set user's last message in realtime database
                // TODO: Change the message text if the message includes media or not
                await RTDBService.setLastMessage(
                    data.Conversations!.Users.map((item) => item.UserID),
                    convID,
                    message!,
                    payload.sub,
                    data.Conversations!.Users.find(
                        (item) => item.UserID === payload.sub
                    )?.FullName ?? "[AG4U User]"
                );

                // 4. Broadcast the message through FCM notification service
                await FCMService.multiSend(
                    data
                        .Conversations!.Users.filter((item) =>
                            Boolean(item.UsersAuth?.FCMToken)
                        )
                        .map((item) => ({
                            fcmToken: item.UsersAuth?.FCMToken!,
                            imageUrl: item.ProfilePicture?.MediaURL,
                        })),
                    {
                        message: message!,
                        event: event,
                        medias: (medias?.length ?? 0) > 0 ? medias![0] : "",
                        senderName:
                            data.Conversations?.Users.find(
                                (item) => item.UserID === payload.sub
                            )?.FullName ?? "AG4U User",
                    }
                );
            }
            // TODO: User TYPING event
            // TODO: ACK event (Delivered/seen status)

            return c.json({
                success: true,
                message: "Message sent",
                data: {},
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

sendMessageAPI.get(
    "/read/:conversationID",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            const conv = await prisma.conversations.findFirst({
                where: {
                    ConversationID: c.req.param("conversationID"),
                },
                select: {
                    Users: {
                        select: {
                            UserID: true,
                        },
                    },
                    Messages: {
                        select: {
                            MessageID: true,
                            Users: {
                                select: {
                                    UserID: true,
                                },
                            },
                        },
                        take: 1,
                        orderBy: {
                            Timestamp: "desc",
                        },
                    },
                },
            });

            if (!conv) {
                return c.json(
                    {
                        success: false,
                        message: "Invalid conversation ID",
                        data: {},
                    },
                    400
                );
            }

            console.log(conv);

            const senders = conv.Users.filter(
                (item) => item.UserID !== payload.sub
            );

            if (senders.length === 0) return c.json({
                success: true,
                message: "No messages found. Skipping message read update.",
                data: {},
            });

            const senderUID = senders[0].UserID;

            await RTDBService.setReadStatus(
                senderUID,
                payload.sub,
                c.req.param("conversationID")
            );

            if (conv.Messages.length === 0) return c.json({
                success: true,
                message: "No messages found. Skipping message read update.",
                data: {},
            })

            // If the last message is not from the user, update the read status
            if (conv.Messages[0].Users.UserID !== payload.sub) {
                await prisma.messages.updateMany({
                    where: {
                        Timestamp: {
                            lte: new Date(),
                        },
                        Users: {
                            UserID: senderUID,
                        },
                    },
                    data: {
                        MessageState: "READ",
                    },
                });
            }

            return c.json({
                success: true,
                message: "Read status updated",
                data: {},
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

export default sendMessageAPI;
