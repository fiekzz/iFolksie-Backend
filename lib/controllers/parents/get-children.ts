import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import { prisma } from "../../app/prisma";

const getChildrenAPI = new Hono()

getChildrenAPI.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        
        try {
            
            const payload = c.get("jwtPayload");

            const children = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub
                },
                select: {
                    Children: {
                        select: {
                            StudentID: true,
                            FullName: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true
                                }
                            }
                        }
                    }
                }
            })

            return c.json({
                message: `Queried ${children?.Children.length} children`,
                success: true,
                data: children
            });
        } catch (error) {

            console.log(error);

            return c.json({
                message: (error as any)?.message ?? 'An unknown error has occurred. Please contact AG4U support.',
                success: false,
                data: {}
            })
        }
        
    }
);

export default getChildrenAPI;