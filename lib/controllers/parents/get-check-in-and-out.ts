import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const checkInAndOut = new Hono();

checkInAndOut.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            const transactions = await prisma.$transaction([
                fetchStudentCheckInOut("Check In", payload.sub),
                fetchStudentCheckInOut("Check Out", payload.sub),
            ]);

            const checkIns = transactions[0]?.Children.filter((child) => child.DailyLogs.length > 0);
            const checkOuts = transactions[1]?.Children.filter((child) => child.DailyLogs.length > 0);

            return c.json({
                message: "Successfully fetched overview card for parents",
                data: {
                    checkIns,
                    checkOuts,
                },
                success: true,
            });
        } catch (error) {
            console.log(error);

            return c.json(
                {
                    message: "Failed to fetch overview card for parents",
                    success: false,
                    data: {},
                },
                500
            );
        }
    }
);

function fetchStudentCheckInOut(
    status: "Check In" | "Check Out",
    userID: string
) {
    return prisma.users.findFirst({
        where: {
            UserID: userID,
        },
        select: {
            Children: {
                select: {
                    StudentID: true,
                    FullName: true,
                    AGClasses: {
                        select: {
                            ClassName: true,
                            Branch: {
                                select: {
                                    BranchName: true
                                }
                            }
                        }
                    },
                    PictureURL: {
                        select: {
                            MediaURL: true,
                        },
                    },
                    DailyLogs: {
                        select: {
                            DLID: true,
                            Temperature: true,
                            DailyLogsType: {
                                select: {
                                    Type: true,
                                    Description: true,
                                    Content: true,
                                },
                            },
                            Timestamp: true,
                            Medias: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                        },
                        where: {
                            DailyLogsType: {
                                Type: status,
                            },
                        },
                    },
                },
                take: 15,
            },
        },
    });
}

export default checkInAndOut;
