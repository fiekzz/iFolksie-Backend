import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";
import { prisma } from "../../app/prisma";
import { inspect } from "node:util";

const studentsWithParents = new Hono();

studentsWithParents.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        const payload = c.get("jwtPayload");

        try {

            const teacherBranch = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub
                },
                select: {
                    AGClasses: {
                        select: {
                            Branch: {
                                select: {
                                    BranchID: true
                                }
                            },
                            ClassID: true,
                            ClassName: true
                        },
                        take: 1
                    },
                }
            })
            
            if (teacherBranch?.AGClasses.length === 0) {
                return c.json({
                    message: "No classes found for the teacher",
                    data: {},
                    success: false
                }, 400)
            }

            const studentsByBranch = await prisma.branch.findFirst({
                where: {
                    BranchID: teacherBranch?.AGClasses[0].Branch?.BranchID
                },
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
                                        }
                                    },
                                    Parents: {
                                        select: {
                                            FullName: true,
                                            UserID: true,
                                            MobileNumber: true,
                                            EmailAddress: true,
                                            ProfilePicture: {
                                                select: {
                                                    MediaURL: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            const totalStudents = studentsByBranch?.AGClasses.reduce((prev, curr) => prev + curr.Students.length, 0)
            
            return c.json({
                message: `Queried ${studentsByBranch?.AGClasses.length} branches & ${totalStudents} students`,
                data: studentsByBranch
            })

        } catch (error) {

            console.log(error);

            return c.json({
                success: false,
                message: (error as Error)?.message ?? 'Something went wrong.',
                data: {}
            }, 500)

        }
    }
);

export default studentsWithParents;
