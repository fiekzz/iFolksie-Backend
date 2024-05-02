import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";
import { prisma } from "../../../app/prisma";

const ALLOWED_ROLES = ['administrator', 'staff', 'branch manager']

const getStudentsByBranch = new Hono();

getStudentsByBranch.get(
    "/:classID",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const classID = c.req.param('classID')

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

            const studentsByBranch = await prisma.aGClasses.findFirst({
                where: {
                    ClassID: classID
                },
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
                                }
                            }
                        }
                    }
                }
            })

            const totalStudents = studentsByBranch?.Students.length
            const className = studentsByBranch?.ClassName

            return c.json({
                message: `Fetched ${totalStudents} students by branch (${className})`,
                data: studentsByBranch,
                success: true
            })


        } catch (error) {

            return c.json({
                message: "An error occurred while fetching students by branch",
                data: {},
                success: false
            })

        }
    }
)

export default getStudentsByBranch;