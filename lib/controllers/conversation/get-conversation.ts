import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const getConversationList = new Hono();

getConversationList.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        const payload = c.get("jwtPayload");

        try {
        
            const response = await prisma.conversations.findMany({
                where: {
                    Users: {
                        some: {
                            UserID: payload.sub
                        }
                    },
                    Messages: {
                        some: {}
                    },
                    ConversationState: 'ACTIVE'
                },
                select: {
                    ConversationID: true,
                    Users: {
                        select: {
                            UserID: true,
                            FullName: true,
                            ProfilePicture: {
                                select: {
                                    MediaURL: true
                                }
                            }
                        },
                        // where: {
                        //     NOT: {
                        //         UserID: payload.sub
                        //     }
                        // }
                    },
                    Messages: {
                        select: {
                            MessageContent: true,
                            Timestamp: true,
                            MessageState: true,
                            FUserID: true
                        },
                        orderBy: {
                            Timestamp: 'desc'
                        },
                        take: 1,
                    },
                },
            })

            const userConversations = response.map((c) => c.ConversationID);

            const promises = []

            for (const conversationID of userConversations) {
                promises.push(prisma.messages.findFirst({
                    where: {
                        Conversations: {
                            ConversationID: conversationID
                        },
                        MessageState: 'READ'
                    },
                    orderBy: {
                        Timestamp: 'desc'
                    }
                }))
            }

            const lastUnreadMessages = await prisma.$transaction(promises);

            const unreadPromises = []
            const conversationIDs: string[] = []

            // TODO: VERY UNOPTIMIZED CODE!! (if it works, dont touch it)
            for (const item of lastUnreadMessages) {

                if (item) {
                    conversationIDs.push(item.FConversationID);
                    unreadPromises.push(prisma.messages.count({
                        where: {
                            FConversationID: item.FConversationID,
                            Timestamp: {
                                gt: item.Timestamp
                            },
                            Conversations: {
                                ConversationState: 'ACTIVE'
                            }
                        }
                    }))
                }

            }

            const unreadCounts = await prisma.$transaction(unreadPromises);

            return c.json({
                data: response.map((item) => {

                    const unreadCountIdx = conversationIDs.findIndex((id) => id === item.ConversationID);

                    return {
                        ...item,
                        unreadCount: unreadCounts[unreadCountIdx]
                    }

                }),
                message: "Successfully fetched conversations",
                success: true
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

getConversationList.get(
    "/:conversationID",
    jwt({
        secret: process.env.JWT_SECRET!
    }),
    async (c) => {

        const payload = c.get("jwtPayload");

        try {
            
            const data = await prisma.conversations.findFirst({
                where: {
                    ConversationID: c.req.param('conversationID'),
                },
                select: {
                    Messages: {
                        select: {
                            MessageID: true,
                            MessageContent: true,
                            MessageState: true,
                            MessageClientID: true,
                            Timestamp: true,
                            FUserID: true,
                            FConversationID: true,
                        },
                        orderBy: {
                            Timestamp: 'desc'
                        }
                    }
                }
            })

            const returnData = data?.Messages

            // const data = await prisma.messages.findMany({
            //     where: {
            //         FConversationID: c.req.param('conversationID')
            //     },
            //     orderBy: {
            //         Timestamp: 'desc',
            //     },
            // })

            return c.json({
                data: returnData,
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

export default getConversationList;