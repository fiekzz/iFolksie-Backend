import { Hono } from "hono";
import { prisma } from "../../app/prisma";
import { jwt } from "hono/jwt";
import { DateTime } from "luxon";
import { PaymentStatus } from "./ag4u-payment-constants";
import { inspect } from "util";

const getUpcomingPaymentsV2 = new Hono();

interface IAvailablePayment {
    StudentID: string;
    FullName: string;
    InvoiceID: string;
    Amount: number;
    Description: string;
    DueAt: Date;
    InvoiceNo: string;
}

getUpcomingPaymentsV2.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        const todaysDate = DateTime.now().toJSDate();

        try {
            const userData = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    Children: {
                        select: {
                            FullName: true,
                            StudentID: true,
                            Invoice: {
                                where: {
                                    IssuedAt: {
                                        lte: todaysDate,
                                    },
                                },
                                select: {
                                    Amount: true,
                                    Description: true,
                                    DueAt: true,
                                    InvoiceNo: true,
                                    InvoiceID: true,
                                    Transaction: {
                                        select: {
                                            Status: true,
                                        }
                                        // where: {
                                        //     Status: "completed",
                                        // },
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
                    200
                );
            }

            console.log(inspect(userData, false, 10, true));
            

            const totalUpcomingInvoices =
                userData?.Children.map((child) => child.Invoice.length).reduce(
                    (prev, current) => prev + current,
                    0
                ) ?? 0;

            if (totalUpcomingInvoices === 0) {
                return c.json(
                    {
                        success: false,
                        data: {},
                        message: "No upcoming payments found",
                    },
                    200
                );
            }

            const availablePayments: IAvailablePayment[] = [];

            userData.Children.forEach((child) => {
                child.Invoice.forEach((invoice) => {
                    if (invoice.Transaction.length > 0) {
                        // This block means that the invoice has already been paid
                        return;
                    }

                    availablePayments.push({
                        StudentID: child.StudentID,
                        FullName: child.FullName,
                        InvoiceID: invoice.InvoiceID,
                        Amount: invoice.Amount,
                        Description: invoice.Description,
                        DueAt: invoice.DueAt,
                        InvoiceNo: invoice.InvoiceNo,
                    });
                });
            });

            return c.json(
                {
                    success: true,
                    data: availablePayments,
                    message: `${availablePayments.length} upcoming payments found`,
                },
                200
            );
        } catch (e: Error | any) {
            return c.json(
                {
                    success: false,
                    data: {},
                    message: e.message,
                },
                500
            );
        }
    }
);

export default getUpcomingPaymentsV2;
