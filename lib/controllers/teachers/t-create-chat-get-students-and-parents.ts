import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";
import { prisma } from "../../app/prisma";
import { inspect } from "node:util";

const tStudentsWithParentsV2 = new Hono();

tStudentsWithParentsV2.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            const teacherBranch = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    AGClasses: {
                        select: {
                            ClassID: true,
                            ClassName: true
                        },
                    },
                },
            });

            if (teacherBranch?.AGClasses.length === 0) {
                return c.json(
                    {
                        message: "No classes found for the teacher",
                        data: {},
                        success: false,
                    },
                    400
                );
            }

            const students = await prisma.students.findMany({
                where: {
                    AGClasses: {
                        some: {
                            ClassID: {
                                in:
                                    teacherBranch?.AGClasses.map(
                                        (c) => c.ClassID
                                    ) ?? [],
                            },
                        },
                    },
                },
                select: {
                    AGClasses: {
                        select: {
                            ClassName: true
                        }
                    },
                    StudentID: true,
                    FullName: true,
                    PictureURL: {
                        select: {
                            MediaURL: true,
                        },
                    },
                    Parents: {
                        select: {
                            FullName: true,
                            UserID: true,
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

            const totalStudents = students.length;

            return c.json({
                message: `Queried ${totalStudents} students`,
                data: {
                    students,
                    classes: teacherBranch?.AGClasses,
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

export default tStudentsWithParentsV2;
