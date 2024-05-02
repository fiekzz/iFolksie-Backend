import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { prisma } from "../../../app/prisma";
import { cors } from "hono/cors";

const ALLOWED_ROLES = ["administrator", "branch manager"];

const getAllConversations = new Hono();

getAllConversations.use(
    cors({
        origin: '*',
        allowMethods: ['GET', 'OPTIONS']
    })
);

getAllConversations.get(
    "/",
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

        try {
            const conversations = await prisma.conversations.findMany({
                select: {
                    ConversationID: true,
                    Users: {
                        select: {
                            UserID: true,
                            FullName: true,
                            AGClasses: {
                                select: {
                                    Branch: {
                                        select: {
                                            BranchID: true,
                                            BranchName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            return c.json({
                message: `Successfully fetched ${conversations.length} conversations.`,
                success: true,
                data: conversations,
            });
        } catch (error) {
            console.log(error);

            return c.json(
                {
                    data: {},
                    message:
                        "Something went wrong. If problem persists, please contact support.",
                    success: false,
                },
                500
            );
        }
    }
);

getAllConversations.options(
    '/:branchID',
    (c) => {
        c.header('ALLOW', 'OPTIONS, GET')

        c.status(204)

        return c.body('')
    }
)

getAllConversations.get(
    "/:branchID",
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

        const branchID = c.req.param("branchID");

        try {
            const conversationsByBranch = await prisma.conversations.findMany({
                select: {
                    ConversationID: true,
                    Users: {
                        select: {
                            UserID: true,
                            FullName: true,
                            ProfilePicture: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                            AGClasses: {
                                select: {
                                    ClassName: true,
                                    Branch: {
                                        select: {
                                            BranchID: true,
                                            BranchName: true,
                                        },
                                    },
                                },
                            },
                            Children: {
                                select: {
                                    FullName: true,
                                },
                            },
                        },
                    },
                    Messages: {
                        select: {
                            MessageContent: true,
                            Timestamp: true,
                            MessageState: true,
                            Users: {
                                select: {
                                    FullName: true
                                }
                            }
                        },
                        orderBy: {
                            Timestamp: 'desc'
                        },
                        take: 1,
                    },
                },
                where: {
                    AND: [
                        {
                            Users: {
                                some: {
                                    AGClasses: {
                                        some: {
                                            Branch: {
                                                BranchID: branchID,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        {
                            Users: {
                                some: {
                                    Children: {
                                        some: {
                                            AGClasses: {
                                                some: {
                                                    Branch: {
                                                        BranchID: branchID,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                    ConversationState: 'ACTIVE'
                },
            });

            return c.json({
                message: `Successfully fetched ${conversationsByBranch.length} conversations.`,
                success: true,
                data: conversationsByBranch,
            });
        } catch (error) {
            console.log(error);

            return c.json(
                {
                    data: {},
                    message:
                        "Something went wrong. If problem persists, please contact support.",
                    success: false,
                },
                500
            );
        }
    }
);

getAllConversations.get(
    "/:branchID/:conversationID",
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

        const branchID = c.req.param("branchID");

        const conversationID = c.req.param("conversationID");
        
        try {
            const messages = await prisma.conversations.findFirst({
                select: {
                    ConversationID: true,
                    Users: {
                        select: {
                            UserID: true,
                            FullName: true,
                            Role: {
                                select: {
                                    RoleName: true
                                }
                            },
                            ProfilePicture: {
                                select: {
                                    MediaURL: true
                                }
                            }
                            // AGClasses: {
                            //     select: {
                            //         Branch: {
                            //             select: {
                            //                 BranchID: true,
                            //                 BranchName: true,
                            //             },
                            //         },
                            //     },
                            // },
                        },
                    },
                    Messages: {
                        select: {
                            MessageID: true,
                            MessageContent: true,
                            MessageReference: true,
                            MessageState: true,
                            Timestamp: true,
                            Users: {
                                select: {
                                    UserID: true
                                }
                            }
                        },
                        orderBy: {
                            Timestamp: 'asc'
                        }
                    }
                },
                where: {
                    ConversationID: conversationID
                }
            });

            return c.json({
                message: "Messages fetched successfully",
                success: true,
                data: messages,
            });
        } catch (error) {
            return c.json({
                message: "Failed to fetch conversations",
                success: false,
                data: {},
            });
        }
    }
);

export default getAllConversations;
