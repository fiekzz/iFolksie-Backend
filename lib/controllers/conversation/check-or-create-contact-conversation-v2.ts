import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const checkOrCreateConversation2 = new Hono();

const zCheckConversation = z.object({
    userID: z.string(),
    childID: z.string(),
    isParent: z.boolean(),
});

type ICheckConversation = z.infer<typeof zCheckConversation>;

checkOrCreateConversation2.post(
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
                    AND: [
                        {
                            Users: {
                                some: {
                                    UserID: {
                                        in: [payload.sub],
                                    },
                                },
                            }
                        },
                        {
                            Users: {
                                some: {
                                    UserID: {
                                        in: [body.userID],
                                    },
                                },
                            }
                        }
                    ],
                    ConversationState: "ACTIVE",
                    // Users: {
                    //     every: {
                    //         OR: [
                    //             {
                    //                 UserID: payload.sub,
                    //             },
                    //             {
                    //                 UserID: body.userID,
                    //             },
                    //         ],
                    //     },
                    // },
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
                                    MediaURL: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!data) {
                // If teacher is trying to create a conversation with a parent,
                // then we need to create a conversation between both parent and the teacher.
                // Requester token: teacher's ID
                // UserID: parent's ID
                // ChildID: student's ID
                // isParent: false

                // NOT A PARENT
                if (!body.isParent) {
                    // GET THE PARENTS OF THE STUDENT
                    const childrenOfParent = await prisma.students.findFirst({
                        where: {
                            Parents: {
                                some: {
                                    UserID: body.userID,
                                },
                            },
                            StudentID: body.childID,
                        },
                        select: {
                            Parents: {
                                select: {
                                    UserID: true,
                                },
                            },
                            FullName: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                        },
                    });

                    if (!childrenOfParent) {
                        return c.json(
                            {
                                success: false,
                                message: `Parent not found.`,
                                data: {},
                            },
                            400
                        );
                    }

                    const createConversation =
                        await prisma.conversations.create({
                            data: {
                                Users: {
                                    connect: [
                                        {
                                            UserID: payload.sub,
                                        },
                                        {
                                            UserID: body.userID,
                                        },
                                        // TEMPORARILY DISABLE GROUP CHAT BECAUSE IT IS VERY BUGGY
                                        // ...childrenOfParent.Parents.map(
                                        //     (item) => {
                                        //         return {
                                        //             UserID: item.UserID,
                                        //         };
                                        //     }
                                        // ),
                                    ],
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
                                                MediaURL: true,
                                            },
                                        },
                                    },
                                },
                            },
                        });

                    return c.json({
                        success: true,
                        message: "Created a new conversation",
                        data: {
                            ConversationID: createConversation.ConversationID,
                            Users: createConversation.Users,
                            Student: {
                                FullName: childrenOfParent.FullName,
                                PictureURL:
                                    childrenOfParent.PictureURL?.MediaURL,
                                StudentID: body.childID,
                            },
                        },
                    });
                } else {
                    // If parent is trying to create a conversation with a teacher,
                    // then we need to create a conversation between the parent (alongside another parent) and the teacher.
                    // Requester token: parent's ID
                    // UserID: teacher's ID
                    // ChildID: student's ID
                    // isParent: true

                    // BEGIN PARENT ROUTINE -----------------------------------

                    // GET THE PARENTS OF THE STUDENT
                    const childrenOfParent = await prisma.students.findFirst({
                        where: {
                            Parents: {
                                some: {
                                    UserID: payload.sub,
                                },
                            },
                            StudentID: body.childID,
                        },
                        select: {
                            Parents: {
                                select: {
                                    UserID: true,
                                },
                            },
                            FullName: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                        },
                    });

                    if (!childrenOfParent) {
                        return c.json(
                            {
                                success: false,
                                message: `Parent not found.`,
                                data: {},
                            },
                            400
                        );
                    }

                    const createConversation =
                        await prisma.conversations.create({
                            data: {
                                Users: {
                                    connect: [
                                        {
                                            UserID: body.userID, // target teacher's ID
                                        },
                                        {
                                            UserID: payload.sub, // parent's ID
                                        },
                                        // TEMPORARILY DISABLE GROUP CHAT BECAUSE IT IS VERY BUGGY
                                        // ...childrenOfParent.Parents.map(
                                        //     (item) => {
                                        //         return {
                                        //             UserID: item.UserID,
                                        //         };
                                        //     }
                                        // ),
                                    ],
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
                                                MediaURL: true,
                                            },
                                        },
                                    },
                                },
                            },
                        });

                    return c.json({
                        success: true,
                        message: "Created a new conversation",
                        data: {
                            ConversationID: createConversation.ConversationID,
                            Users: createConversation.Users,
                            Student: {
                                FullName: childrenOfParent.FullName,
                                PictureURL:
                                    childrenOfParent.PictureURL?.MediaURL,
                                StudentID: body.childID,
                            },
                        },
                    });
                }
            }

            // THIS CODE IS BUGGY!!! IT SHOULD RETURN STUDENT'S DATA INSTEAD OF USER'S DATA
            return c.json({
                success: true,
                message: "Conversation found.",
                data: {
                    ConversationID: data.ConversationID,
                    Users: data.Users,
                    Student: {
                        FullName: data.Users[0]?.FullName,
                        PictureURL: data.Users[0]?.ProfilePicture?.MediaURL,
                        StudentID: body.childID,
                    },
                },
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

export default checkOrCreateConversation2;
