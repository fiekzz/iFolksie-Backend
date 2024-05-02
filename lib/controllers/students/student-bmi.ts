import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const studentBmi = new Hono()

const ALLOWED_ROLES = ["administrator", "Branch Manager", "parent"];

studentBmi.get(
    "/fetch/:id",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        const payload = c.get("jwtPayload")

        const id = c.req.param("id")

        const role = payload["role"] as string[]

        const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r))

        if (!isAllowed) {
            return c.json({
                message: "You are not allowed to access this resource",
                success: false,
                data: {},
            }, 401)
        }

        try {

            const data = await prisma.students.findFirst({
                where: {
                    StudentID: id
                },
                select: {
                    Height: true,
                    Weight: true
                }
            })
    
            return c.json({
                message: "You are allowed to access this resource",
                success: true,
                data: data,
            })

        } catch (error) {

            console.log(error)

            return c.json({
                message: "Something went wrong",
                data: {
                    error: (error as Error)?.message ?? "Internal error occurred",
                },
                success: false,
            }, 500);

        }


    }
)

interface IHeightWeightRequest {
    studentID: string;
    height: number;
    weight: number;
}

studentBmi.post(
    "/update",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const payload = c.get("jwtPayload")

            const role = payload["role"] as string[]

            const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r))

            if (!isAllowed) {
                return c.json({
                    message: "You are not allowed to access this resource",
                    success: false,
                    data: {},
                }, 401)
            }
    
            const body = await c.req.json() as IHeightWeightRequest
    
            await prisma.students.update({
                where: {
                    StudentID: body.studentID
                },
                data: {
                    Height: body.height,
                    Weight: body.weight
                }
            })

            return c.json(
                {
                    message: "Height and weight updated successfully",
                    success: true,
                    data: {},
                },
                201
            );

        } catch (err) {

            return c.json(
                {
                    message: err,
                    success: false,
                    data: {},
                },
                500
            );
        }
    }
)

export default studentBmi