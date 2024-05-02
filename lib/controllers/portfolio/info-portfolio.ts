import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const ALLOWED_ROLES = ["administrator", "branch manager"];

const infoPortfolio = new Hono();

infoPortfolio.get(
    "/:memoryId",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        const payload = c.get("jwtPayload")

        const role = payload["role"] as string[]

        const memoryId = c.req.param('memoryId')

        const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r))

        if (!isAllowed) {
            return c.json({
                message: "You are not allowed to access this resource",
                success: false,
                data: {},
            }, 401)
        }

        try {

            const data = await prisma.portfolioAlbum.findFirst({
                where: {
                    AlbumID: memoryId
                },
                select: {
                    AlbumName: true,
                    AlbumCover: {
                        select: {
                            MediaURL: true
                        }
                    },
                }
            })

            return c.json({
                message: "Portfolio details fetched successfully",
                data: data,
                success: true,
            })

        } catch (err) {

            console.log(err)

            return c.json({
                message: "Internal server error",
                success: false,
                data: {},
            }, 500)

        }

    }
)

export default infoPortfolio;