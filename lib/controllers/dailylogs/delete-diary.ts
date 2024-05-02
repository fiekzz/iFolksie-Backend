import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const deleteDiary = new Hono()

const ALLOWED_ROLES = ["administrator", "branch manager"];

deleteDiary.get(
    "/get-role",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

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

        return c.json({
            message: "You are allowed to access this resource",
            success: true,
            data: {},
        })
    }
)

interface IDiaryDelete {
    diaryId: string;
}

deleteDiary.post(
    "/confirm",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

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

        
        try {
            
            const body = await c.req.json() as IDiaryDelete;

            await prisma.dailyLogs.delete({
                where: {
                    DLID: body.diaryId
                },
            })

            return c.json({
                message: "Diary deleted successfully",
                success: true,
                data: {},
            })

        } catch (error) {

            console.log(error)

            return c.json({
                message: "Internal server error",
                success: false,
                data: {},
            }, 500)

        }
    }
)

export default deleteDiary;