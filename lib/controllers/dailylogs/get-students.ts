import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";
import { prisma } from "../../app/prisma";

const getStudents = new Hono();

getStudents.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        const payload = c.get("jwtPayload");

        try {

            const teacherClasses = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub
                },
                select: {
                    AGClasses: {
                        select: {
                            Branch: {
                                select: {
                                    BranchName: true,
                                    AGClasses: {
                                        select: {
                                            ClassID: true,
                                            ClassName: true,
                                            Students: {
                                                select: {
                                                    StudentID: true,
                                                    FullName: true,
                                                    PictureURL: {
                                                        select: {
                                                            MediaURL: true,
                                                            MediaKey: true,
                                                            UploadedAt: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        where: {
                            Teachers: {
                                every: {
                                    UserID: payload.sub
                                }
                            }
                        }
                    }
                }
            })

            const totalStudents = teacherClasses?.AGClasses[0].Branch?.AGClasses.reduce((prev, curr) => prev + curr.Students.length, 0)
            
            return c.json({
                message: `Queried ${teacherClasses?.AGClasses[0].Branch?.AGClasses.length} branches & ${totalStudents} students`,
                data: teacherClasses?.AGClasses[0].Branch
            })

        } catch (error) {

            console.log(error);

            return c.json({
                success: false,
                message: (error as Error)?.message ?? 'Something went wrong.',
                data: {}
            })

        }

        // return c.json({
        //     message: "Hello",
        //     payload
        // });
    }
);

export default getStudents;
