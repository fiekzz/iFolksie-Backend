import { prisma } from "../../../app/prisma";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { DateTime } from "luxon";

const teacherDiaryRejectedList = new Hono();

teacherDiaryRejectedList.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            
            const teacherID = payload.sub;

            let dt: DateTime | null

            dt = DateTime.fromISO(c.req.query("time") ?? "");

            console.log(`dt: ${dt}`)
            if (!dt) {
                dt = DateTime.now();
            }

            console.log(`dt: ${dt}`)

            const teacherDiary = await prisma.dailyLogs.findMany({
                where: {
                    UploadedBy: {
                        UserID: teacherID
                    },
                    Medias: {
                        some: {
                            MediaState: "REJECTED",
                        }
                    },
                    TimePosted: {
                        gte: dt.toJSDate(),
                        lt: dt.plus({ days: 1 }).toJSDate()
                    }
                },
                select: {
                    DLID: true,
                    TimePosted: true,
                    UploadedBy: {
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
                                    ClassID: true,
                                    ClassName: true,
                                }
                            }
                        }
                    },
                    DailyLogsType: true,
                },
            })

            return c.json({
                message: "Teacher diary list",
                success: true,
                data: teacherDiary
            });

        } catch (error) {

            console.log(error)
            
            return c.json({
                message: "An error occurred",
                success: false,
                data: {}
            }, 500);
        }
    }
)

export default teacherDiaryRejectedList