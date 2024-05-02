// TODO: PAGINATION

import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { inspect } from "util";
import { string } from "zod";
import { DateTime } from "luxon";
import { Prisma } from '@prisma/client'

const checkInAndOutv2 = new Hono();

export class AGError extends Error {

    statusCode: number;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = "AGError";
        this.statusCode = statusCode || 500;
    }
}

interface ICheckInOut {
    DLID: string;
    Temperature: number | null;
    Timestamp: Date;
    Medias: {
        MediaURL: string;
    }[];
    DailyLogsType: {
        Type: string;
        Description: string;
        Content: Prisma.JsonValue;
    };
}

interface IStudentCheckInOut {
    [studentID: string]: CheckInOutPair[];
}

interface CheckInOutPair {
    checkIn: ICheckInOut;
    checkOut?: ICheckInOut;
}

checkInAndOutv2.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {

            const usersChildren = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    Children: {
                        select: {
                            StudentID: true,
                            FullName: true,
                        },
                    },
                },
            });

            if (!usersChildren) {
                throw new AGError("User has no children registered.", 400);
            }
            
            const children = usersChildren.Children;

            const allChildrenData: CheckInOutPair[] = [];

            for await (const child of children) {
                const transactions = await fetchStudentCheckInOut(child.StudentID);

                for (const item of transactions.checkIns) {

                    const checkInAGISOTime = getISODate(item.Timestamp);

                    const checkOut = transactions.checkOuts.find((checkOut) => {
                        return getISODate(checkOut.Timestamp) === checkInAGISOTime;
                    });

                    allChildrenData.push({
                        checkIn: item,
                        checkOut,
                    });

                    // if (!dataMap[child.StudentID]) {
                    //     dataMap[child.StudentID] = [];
                    // }

                    // dataMap[child.StudentID].push({
                    //     checkIn: item,
                    //     checkOut: transactions.checkOuts.find((checkOut) => {
                    //         return getISODate(checkOut.Timestamp) === checkInAGISOTime;
                    //     })
                    // });

                }


            }

            // console.log(inspect(transactions, false, 10, true));
            
            return c.json({
                message: "Successfully fetched check ins and check outs for parents",
                success: true,
                data: allChildrenData.sort((a, b) => {
                    return b.checkIn.Timestamp.getTime() - a.checkIn.Timestamp.getTime();
                }),
            })

        } catch (error) {

            if (error instanceof AGError) {

                return c.json(
                    
                    {
                        message: error.message,
                        success: false,
                        data: {},
                    },
                    error.statusCode
                );

            }
            
            console.log(error);

            return c.json(
                {
                    message: "Failed to fetch check ins and check outs for parents",
                    success: false,
                    data: {},
                },
                500
            );

        }

    }
)

const getISODate = (date: Date) => {

    return DateTime.fromJSDate(date).toISODate()!

}

async function fetchStudentCheckInOut(
    studentID: string,
) {
    const checkIn = fetchStudentSingleCheckInOrOut("Check In", studentID);
    const checkOut = fetchStudentSingleCheckInOrOut("Check Out", studentID);

    const transaction = await prisma.$transaction([checkIn, checkOut]);

    return {
        checkIns: transaction[0],
        checkOuts: transaction[1],
    };
}

function fetchStudentSingleCheckInOrOut(
    status: "Check In" | "Check Out",
    studentID: string
) {
    return prisma.dailyLogs.findMany({
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
            Students: {
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
                }
            }
        },
        where: {
            DailyLogsType: {
                Type: status,
            },
            Students: {
                some: {
                    StudentID: studentID
                }
            },
        },
    })
}

export default checkInAndOutv2