import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const overviewCard = new Hono()

overviewCard.get("/", jwt({
    secret: process.env.JWT_SECRET!,
}), async (c) => {

    const payload = c.get('jwtPayload');

    try {
        
        const latestDL = await prisma.users.findFirst({
            where: {
                UserID: payload.sub
            },
            select: {
                FullName: true,
                Children: {
                    select: {
                        StudentID: true,
                        FullName: true,
                        PictureURL: {
                            select: {
                                MediaURL: true
                            }
                        },
                        DailyLogs: {
                            select: {
                                DLID: true,
                                DailyLogsType: {
                                    select: {
                                        Type: true,
                                        Description: true,
                                        Content: true
                                    }
                                },
                                Timestamp: true,
                                Medias: {
                                    select: {
                                        MediaURL: true
                                    }
                                }
                            },
                            orderBy: {
                              Timestamp: 'desc'  
                            },
                            take: 1
                        }
                    }
                }
            }
        })

        return c.json({
            message: "Successfully fetched overview card for parents",
            data: latestDL,
            success: true
        })

    } catch (error) {

        console.log(error);
        
        return c.json({
            message: "Failed to fetch overview card for parents",
            success: false,
            data: {}
        }, 500)

    }

})

export default overviewCard;