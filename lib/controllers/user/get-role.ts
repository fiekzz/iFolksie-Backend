import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const getRole = new Hono()

getRole.get(
    "/get-role",
    async (c) => {

        const roles = await prisma.roles.findMany()

        return c.json({
            message: "You are allowed to access this resource",
            success: true,
            data: roles,
        })

    }
)

export default getRole