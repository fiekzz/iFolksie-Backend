import { Hono } from "hono";
import { z } from "zod";
import axios from "axios";
import { jwt } from "hono/jwt";
import { ITekkisPaymentResponse } from "../../callback/types/TekkisCreatePaymentResponse";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../../../app/prisma";
import { title } from "process";

const zPaymentTypes = z.object({
    invoiceId: z.string(),
    subInvoiceIdList: z.array(z.string()),
    // paymentAmount: z.number(),
});

type IPaymentTypes = z.infer<typeof zPaymentTypes>;

const v2ProceedPayment = new Hono();

v2ProceedPayment.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const hasher = new Bun.CryptoHasher("sha256");

            const body = await c.req.json() as IPaymentTypes;

            const userId = c.get('jwtPayload').sub;

            const userData = await prisma.users.findFirst({
                where: {
                    UserID: userId,
                },
                select: {
                    FullName: true,
                    EmailAddress: true,
                }
            })

            if (!userData) {
                return c.json({
                    message: "User not found",
                    success: false,
                    data: {},
                }, 404);
            }

            const invoice = await prisma.invoice.findFirst({
                where: {
                    InvoiceID: body.invoiceId,
                },
                select: {
                    Description: true,
                    InvoiceNo: true,
                }
            })

            if (!invoice) {
                return c.json({
                    message: "Invoice not found",
                    success: false,
                    data: {},
                }, 404);
            }

            const subInvoiceDataList = await prisma.subInvoice.findMany({
                where: {
                    SubinvoiceID: {
                        in: body.subInvoiceIdList
                    }
                },
                select: {
                    SubinvoiceID: true,
                    Amount: true,
                    Student: {
                        select: {
                            StudentID: true,
                            FullName: true,
                        }
                    }
                }
            })

            if (subInvoiceDataList.length !== body.subInvoiceIdList.length) {
                return c.json({
                    message: "Subinvoice not found",
                    success: false,
                    data: {},
                }, 404);
            }

            const totalAmountFromDB = subInvoiceDataList.reduce((prev, curr) => prev + curr.Amount, 0);
            // const totalAmountFromUser = body.paymentAmount;

            // if (totalAmountFromDB > totalAmountFromUser) {
            //     return c.json({
            //         message: "Invalid amount",
            //         success: false,
            //         data: {},
            //     }, 400);
            // }


            hasher.update(
                process.env.TEKKIS_MERCHANT_KEY! + process.env.TEKKIS_SECRET_KEY!
            );

            // const data = {
            //     merchantKey: process.env.TEKKIS_MERCHANT_KEY!,
            //     signature: hasher.digest("hex"),
            //     paymentName: "John Smith",
            //     paymentEmail: "johnsmith@test.com",
            //     paymentDesc: "Car Rental Payment",
            //     paymentAmount: "150.00",
            //     paymentRefNo: "ABC123456",
            //     paymentRedirectURL: "https://www.google.com",
            //     paymentCallbackURL: "https://eo7g3u984vhmygx.m.pipedream.net",
            //     paymentCustomFields: [
            //         {
            //             uid: "1",
            //             title: "Parking Date",
            //             value: "20/12/22",
            //         },
            //     ],
            // };
            
            const data = {
                merchantKey: process.env.TEKKIS_MERCHANT_KEY!,
                signature: hasher.digest("hex"),
                paymentName: userData?.FullName,
                paymentEmail: userData?.EmailAddress,
                paymentDesc: invoice.Description,
                paymentAmount: totalAmountFromDB.toString(),
                paymentRefNo: invoice.InvoiceNo,
                paymentRedirectURL: "https://www.google.com",
                paymentCallbackURL: "https://api.ag4u.com.my/v5/payments/callback",
                paymentCustomFields: [
                    {
                        title: "Children",
                        value: subInvoiceDataList.map((e) => e.Student.FullName).join(",")
                        // value: body.subInvoiceIdList.join(",")
                    },
                    {
                        title: "Fullname",
                        value: userData?.FullName,
                    },
                    {
                        title: "InvoiceNo",
                        value: invoice.InvoiceNo,
                    },
                    {
                        title: "InvoiceID",
                        value: body.invoiceId,
                    },
                    {
                        title: "SubInvoice",
                        value: body.subInvoiceIdList.join(",")
                    },
                    {
                        title: "UserID",
                        value: userId,
                    }
                ],
            };

            console.log(data);

            const response = await axios.post(
                "https://api-staging.tpay.com.my/payment/addPaymentFromExternal",
                {
                    payload: btoa(JSON.stringify(data)),
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const tekkisResponse = response.data as ITekkisPaymentResponse

            return c.json({
                message: "ok",
                data: tekkisResponse,
                success: true
            });

        } catch (error) {

            console.log(error)

            if (axios.isAxiosError(error)) {
                return c.json({
                    message: error.response?.data.msg || error.response?.data || 'An error occurred',
                    success: false,
                    data: {},
                }, parseInt(error.code ?? '500'));
            }

            return c.json({
                message: "An error occurred",
                success: false,
                data: {},
            }, 500);
        }

    }
)

export default v2ProceedPayment;