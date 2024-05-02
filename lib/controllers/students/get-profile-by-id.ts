import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const studentByID = new Hono();

const zStudentByID = z.object({
    studentID: z.string(),
});

type IStudentByID = z.infer<typeof zStudentByID>;

studentByID.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator('json', zStudentByID),
    async (c) => {
        const payload = c.get("jwtPayload");

        const bodyPayload = await c.req.json<IStudentByID>();

        try {
            const studentData = await prisma.students.findFirst({
                where: {
                    StudentID: bodyPayload.studentID,
                },
                include: {
                    PictureURL: true,
                }
            });

            if (!studentData) {
                return c.json({
                    success: false,
                    message: "Student not found",
                    data: {},
                }, 400);
            }

            return c.json({
                message: `Queried student data`,
                data: studentData
            });
        } catch (error) {
            console.log(error);

            return c.json({
                success: false,
                message: (error as Error)?.message ?? "Something went wrong.",
                data: {},
            }, 500);
        }

        // return c.json({
        //     message: "Hello",
        //     payload
        // });
    }
);

export default studentByID;
