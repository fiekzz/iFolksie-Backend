import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";
import { prisma } from "../../../app/prisma";
import { inspect } from "node:util";

const allStudentsByBranch = new Hono();

allStudentsByBranch.get(
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
                                    BranchID: true,
                                    BranchName: true
                                }
                            },
                            ClassID: true,
                        }
                    },
                }
            })

            const removeDups = (arr: string[]): string[] => {
                return [...new Set(arr)];
            }

            const Branches = teacherBranch?.AGClasses.map((c) => c.Branch?.BranchID)

            const reducedBranches = removeDups(Branches as string[])
            
            if (teacherBranch?.AGClasses.length === 0) {
                return c.json({
                    message: "No classes found for the teacher",
                    data: {},
                    success: false
                }, 400)
            }

            const studentsByBranch = await prisma.branch.findMany({
                where: {
                    BranchID: {
                        in: reducedBranches
                    },   
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
                                            MediaKey: true,
                                            UploadedAt: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            const totalStudents = studentsByBranch?.reduce((prev, curr) => prev + curr.AGClasses.reduce((prev, curr) => prev + curr.Students.length, 0), 0)
            
            return c.json({
                message: `Queried ${studentsByBranch.length} branches & ${totalStudents} students`,
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

        // return c.json({
        //     message: "Hello",
        //     payload
        // });
    }
);

export default allStudentsByBranch;
