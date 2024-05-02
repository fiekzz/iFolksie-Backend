import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import AGSingleton from "../../services/AGSingleton";
import {
    createNextMonthPaymentKey,
    getPaymentStatusForThisMonth,
    parsePaymentKeyToDateTime,
} from "./payment-helpers";

const getUpcomingPayments = new Hono();

interface IPaidData {
    [key: string]: number;
}

export interface IPaymentRedisData {
    paymentMonthlyKey?: string; // 2024-02 (Bila last bayar)
    paymentYearlyKey?: string; // 2024-02 (Bila last bayar)
    // paymentAmount: number; // 1000
}

export enum PaymentStatusEnum {
    pending = "pending",
    paid = "paid",
}

interface IStudentPaymentInfo {
    studentID: string;
    studentName: string;
    amount: number;
    status: PaymentStatusEnum;
    description: string;
}

getUpcomingPayments.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            const userData = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    Children: {
                        select: {
                            StudentID: true,
                            FullName: true,
                            AGClasses: {
                                select: {
                                    BranchPricing: {
                                        select: {
                                            Pricing: true,
                                        },
                                        where: {
                                            // TODO: Check if yearly payment has been issued
                                            PricingType: "MONTHLY",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!userData) {
                return c.json(
                    {
                        success: false,
                        data: {},
                        message: "No user data found",
                    },
                    400
                );
            }

            if (userData.Children.length === 0) {
                return c.json(
                    {
                        success: false,
                        data: {},
                        message: "No child data found",
                    },
                    400
                );
            }

            const { isFeeNextMonthAvailable } = getPaymentStatusForThisMonth();

            if (!isFeeNextMonthAvailable) {
                return c.json(
                    {
                        message: "Payment for next month is not issued yet.",
                        data: [],
                        success: false,
                    },
                    200
                );
            }

            const studentPaymentInfo = await getChildrenPaymentStatus(
                userData.Children
            );

            return c.json({
                message: "Upcoming payments for next month",
                data: studentPaymentInfo,
                success: true,
            });
        } catch (error) {
            if (error instanceof PaymentStatusError) {
                return c.json(
                    {
                        message: error.message,
                        data: {},
                        success: false,
                    },
                    500
                );
            }

            console.log(error);

            return c.json(
                {
                    message:
                        "Oops, something went wrong. If problem persists, please contact support.",
                    errorcode: "REGISTRATION_ERROR",
                },
                500
            );
        }
    }
);

export class PaymentStatusError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export async function getChildrenPaymentStatus(
    children: {
        FullName: string;
        AGClasses: {
            BranchPricing: {
                Pricing: number;
            }[];
        }[];
        StudentID: string;
    }[]
) {
    const studentPaymentInfo: IStudentPaymentInfo[] = [];

    const rds = await AGSingleton.getInstance().getRedis();

    for (let i = 0; i < children.length; i++) {
        const childData = children[i];

        const childPaymentStatusCache = await rds.get(childData.StudentID);

        const monthlyPriceAmtData = children.find(
            (item) => item.StudentID === childData.StudentID
        )?.AGClasses[0]?.BranchPricing[0]?.Pricing;

        if (typeof monthlyPriceAmtData === "undefined") {
            throw new PaymentStatusError(
                "Pricing is not available in the database. Kindly contact AG4U support"
            );
        }

        // Kalau dalam Redis takde data untuk student itu (Maybe first payment / Redis clear data)
        if (!childPaymentStatusCache) {
            studentPaymentInfo.push({
                studentName: childData.FullName,
                studentID: childData.StudentID,
                status: PaymentStatusEnum.pending,
                amount: monthlyPriceAmtData,
                description: DateTime.now()
                    .plus({ month: 1 })
                    .toFormat("MMMM yyyy"),
            });
        } else {
            const lastPaymentDetails = JSON.parse(
                childPaymentStatusCache
            ) as IPaymentRedisData;

            const thisMonthPaymentKey = DateTime.now().toFormat("yyyy-MM");

            // Ini maksudnya payment this month dah buat
            if (lastPaymentDetails.paymentMonthlyKey === thisMonthPaymentKey) {
                studentPaymentInfo.push({
                    studentName: childData.FullName,
                    studentID: childData.StudentID,
                    status: PaymentStatusEnum.paid,
                    amount: 0,
                    description: DateTime.now()
                        .plus({ month: 1 })
                        .toFormat("MMMM yyyy"),
                });
            } else {
                studentPaymentInfo.push({
                    studentName: childData.FullName,
                    studentID: childData.StudentID,
                    status: PaymentStatusEnum.pending,
                    amount: monthlyPriceAmtData,
                    description: DateTime.now()
                        .plus({ month: 1 })
                        .toFormat("MMMM yyyy"),
                });
            }
        }
    }

    return studentPaymentInfo;
}

export default getUpcomingPayments;
