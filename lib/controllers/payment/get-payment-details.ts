import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { PaymentStatus } from "./ag4u-payment-constants";
import { DateTime } from "luxon";
import { createTekkisPayment } from "./pay-fees";

const getPaymentDetails = new Hono();

const BASE_PRICING_CHARGE = 2.3;

getPaymentDetails
    .basePath("/:studentID/:invoiceID")
    .get(
        "/",
        jwt({
            secret: process.env.JWT_SECRET!,
        }),
        async (c) => {
            const invoiceID = c.req.param("invoiceID");
            const studentID = c.req.param("studentID");

            const payload = c.get("jwtPayload");

            try {
                const data = await prisma.invoice.findFirst({
                    where: {
                        InvoiceID: invoiceID,
                        // Transaction: {
                        //     some: {
                        //         Status: 'completed' // tekkis' successful payment status
                        //     }
                        // }
                    },
                    select: {
                        Description: true,
                        Amount: true,
                        Status: true,
                        Students: {
                            select: {
                                FullName: true,
                                StudentID: true,
                                AGClasses: {
                                    select: {
                                        ClassName: true,
                                        Branch: {
                                            select: {
                                                BranchName: true,
                                            },
                                        },
                                    },
                                },
                            },
                            where: {
                                StudentID: studentID,
                            },
                        },
                    },
                });

                if (!data) {
                    return c.json(
                        {
                            data: {},
                            success: false,
                            message: "No payment details found",
                        },
                        200
                    );
                }

                return c.json({
                    data,
                    success: true,
                    message: "Successfully fetched payment details",
                });
            } catch (error) {
                console.log(error);

                return c.json(
                    {
                        data: {},
                        success: false,
                        message:
                            "Oops, something went wrong while fetching your payment details. If problem persists, please contact support.",
                    },
                    500
                );
            }
        }
    )
    .get("/checkout", jwt({
        secret: process.env.JWT_SECRET!,
    }), async (c) => {
        const payload = c.get("jwtPayload");

        const invoiceID = c.req.param("invoiceID");
        const studentID = c.req.param("studentID");

        try {
            const thisMonthPaymentKey = DateTime.now().toFormat("yyyy-MM");

            const data = await prisma.invoice.findFirst({
                where: {
                    InvoiceID: invoiceID,
                    // Transaction: {
                    //     some: {
                    //         Status: 'completed' // tekkis' successful payment status
                    //     }
                    // }
                },
                select: {
                    Description: true,
                    Amount: true,
                    Status: true,
                    PaymentType: true,
                    Students: {
                        select: {
                            FullName: true,
                            StudentID: true,
                            AGClasses: {
                                select: {
                                    ClassName: true,
                                    Branch: {
                                        select: {
                                            BranchName: true,
                                        },
                                    },
                                },
                            },
                        },
                        where: {
                            StudentID: studentID,
                        },
                    },
                },
            });

            if (data?.Students.length === 0) {
                return c.json(
                    {
                        data: {},
                        success: false,
                        message: "No student found",
                    },
                    200
                );
            }

            console.log(payload);

            const paymentData = await createTekkisPayment(
                data!.Amount + BASE_PRICING_CHARGE,
                data!.Students[0].FullName,
                payload['email'],
                `Payment for ${DateTime.now().toFormat("MMMM yyyy")}`,
                data!.Students[0].StudentID,
                thisMonthPaymentKey,
                data!.PaymentType,
                payload.sub,
                invoiceID
            );

            return c.json({
                data: paymentData,
                success: true,
                message: "Successfully created payment",
            });

        } catch (error) {

            console.log(error);

            return c.json(
                {
                    data: {},
                    success: false,
                    message: "Oops, something went wrong while creating your payment. If problem persists, please contact support.",
                },
                500
            );

        }
    });

export default getPaymentDetails;
