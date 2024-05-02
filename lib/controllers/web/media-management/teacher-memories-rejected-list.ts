import { prisma } from "../../../app/prisma";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { DateTime } from "luxon";

const teacherMemoriesRejectedList = new Hono();

teacherMemoriesRejectedList.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const teacherID = c.get('jwtPayload').sub;

            let dt: DateTime | null

            dt = DateTime.fromISO(c.req.query("time") ?? "");

            if (!dt) {
                dt = DateTime.now();
            }

            const teacherMemories = await prisma.portfolio.findMany({
                where: {
                    Teachers: {
                        UserID: teacherID
                    },
                    Medias: {
                        some: {
                            MediaState: "REJECTED",
                        }
                    },
                    Timestamp: {
                        gte: dt.toJSDate(),
                        lt: dt.plus({ days: 1 }).toJSDate()
                    }
                },
                select: {
                    PortfolioID: true,
                    Description: true,
                    Timestamp: true,
                    Teachers: {
                        select: {
                            UserID: true,
                            FullName: true,
                        }
                    },
                    Medias: {
                        select: {
                            MediaID: true,
                            MediaState: true,
                            MediaURL: true,
                            MediaKey: true,
                        }
                    },
                    Students: {
                        select: {
                            StudentID: true,
                            FullName: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true,
                                }
                            },
                            AGClasses: {
                                select: {
                                    ClassName: true,
                                }
                            }
                        }
                    },
                    PortfolioAlbum: {
                        select: {
                            AlbumName: true,
                        }
                    }
                }
            })

            return c.json({
                message: 'Successfully fetched teacher memories',
                success: true,
                data: teacherMemories
            });

        } catch (error) {

            return c.json({
                message: 'Internal Server Error',
                success: false,
                data: {}
            }, 500);

        }

    }
)

export default teacherMemoriesRejectedList;