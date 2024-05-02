import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const getBranch = new Hono()

getBranch.get(
    "/get-branch",
    async (c) => {

        const payload = c.get("jwtPayload")

        const branch = await prisma.branch.findMany({
            include: {
                AGClasses: true,
            },
        });

        return c.json({
            message: "You are allowed to access this resource",
            success: true,
            data: branch,
        })

    }
)

export default getBranch

/* 

const branches = await prisma.branch.findMany({
        include: {
            AGClasses: true,
        },
    });
*/