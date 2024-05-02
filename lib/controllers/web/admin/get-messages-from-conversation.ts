import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { prisma } from "../../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const ALLOWED_ROLES = ["administrator", "branch manager"];

const getAdminWebMessages = new Hono();

getAdminWebMessages.use(
    cors({
        origin: '*',
        allowMethods: ['GET', 'OPTIONS']
    })
);

const zGetAdminMessages = z.object({
    conversationID: z.string(),
})

type IGetAdminMessages = z.infer<typeof zGetAdminMessages>;

getAdminWebMessages.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator('json', zGetAdminMessages),
    async (c) => {
        const payload = c.get("jwtPayload");

        const role = payload["role"] as string[];

        const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r));

        const bodyPayload = await c.req.json<IGetAdminMessages>()

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
            const messages = await prisma.conversations.findMany({
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
                where: {
                    ConversationID: bodyPayload.conversationID,
                    Messages: {
                        some: {}
                    },
                }
            });

            return c.json({
                message: "Conversations fetched successfully",
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

export default getAdminWebMessages