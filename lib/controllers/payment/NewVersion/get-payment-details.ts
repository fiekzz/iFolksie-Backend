import { prisma } from "../../../app/prisma";
import { Hono } from "hono";
import { jwt } from "hono/jwt";

const v2GetPaymentDetails = new Hono();

v2GetPaymentDetails.get(
    "/overview",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const payload = c.get('jwtPayload')

            const data = await prisma.$transaction([
                // Get all invoices
                prisma.invoice.findMany({
                    where: {
                        Users: {
                            some: {
                                UserID: payload.sub
                            }
                        },
                        SubInvoice: {
                            some: {
                                Status: "PENDING"
                            }
                        }
                    },
                    select: {
                        InvoiceID: true,
                        InvoiceNo: true,
                        Description: true,
                        PaymentType: true,
                        DueAt: true,
                        SubInvoice: {
                            where: {
                                Status: "PENDING"
                            }
                        },
                        // TransactionV2: true,
                        // Transaction: true,
                    }
                }),
                // Get all transactions
                prisma.transactionV2.findMany({
                    where: {
                        Users: {
                            UserID: payload.sub
                        },
                    },
                    select: {
                        TransactionID: true,
                        Amount: true,
                        CreatedDateTime: true,
                        Type: true,
                        RefNo: true,
                        Invoice: {
                            select: {
                                Description: true,
                                SubInvoice: {
                                    where: {
                                        Status: "PAID"
                                    },
                                    select: {
                                        Status: true,
                                        Student: {
                                            select: {
                                                FullName: true,
                                                AGClasses: {
                                                    select: {
                                                        Branch: {
                                                            select: {
                                                                BranchName: true,
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                    }
                }),
            ])

            const invoiceData = data[0]

            const transactionData = data[1]

            // const dummyTransactionData: typeof transactionData = [
            //     {
            //         TransactionID: 1,
            //         Amount: 1000,
            //         Invoice: {
            //             SubInvoice: [
            //                 {
            //                     SubinvoiceID: "1",
            //                     Amount: 1000,
            //                     Status: "PENDING",
            //                     studentsStudentID: "1",
            //                     invoiceInvoiceID: "1",
            //                 }
            //             ]
            //         }
            //     }
            // ]

            return c.json({
                message: "Payment details retrieved successfully",
                success: true,
                data: {
                    invoiceData,
                    transactionData,
                },
            });

        } catch (error) {

            console.log(error)

            return c.json({
                message: "An error occurred",
                success: false,
                data: {},
            });

        }

    }
)

v2GetPaymentDetails.get(
    "/invoice-data/:invoiceID",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const payload = c.get('jwtPayload')

            const invoiceID = c.req.param('invoiceID')

            const invoiceData = await prisma.invoice.findFirst({
                where: {
                    InvoiceID: invoiceID,
                    SubInvoice: {
                        some: {
                            Status: "PENDING"
                        }
                    }
                },
                select: {
                    InvoiceID: true,
                    InvoiceNo: true,
                    Description: true,
                    PaymentType: true,
                    DueAt: true,
                    SubInvoice: {
                        where: {
                            Status: "PENDING"
                        },
                        select: {
                            SubinvoiceID: true,
                            Amount: true,
                            Status: true,
                            Student: {
                                select: {
                                    StudentID: true,
                                    FullName: true,
                                    AGClasses: {
                                        select: {
                                            Branch: {
                                                select: {
                                                    BranchName: true,
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            if (!invoiceData) {
                return c.json({
                    message: "Invoice not found",
                    success: false,
                    data: {},
                });
            }

            return c.json({
                message: "Payment details retrieved successfully",
                success: true,
                invoiceData,
            });

        } catch (error) {

            return c.json({
                message: "An error occurred",
                success: false,
                data: {},
            });

        }

    }
)

export default v2GetPaymentDetails