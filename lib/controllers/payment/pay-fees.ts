import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { z } from "zod";
// import { paidHistoryData } from "./get-upcoming-payments";
import { zValidator } from "@hono/zod-validator";
import shaLib from "js-sha256";
import axios from "axios";
import { nanoid } from "nanoid";
import { settings } from "../../constants/global-settings";
import {
    PaymentStatusEnum,
    PaymentStatusError,
    getChildrenPaymentStatus,
} from "./get-upcoming-payments";
import { userInfo } from "os";
import { getPaymentStatusForThisMonth } from "./payment-helpers";
import { ITekkisCBResponse } from "../callback/types/TekkisCallbackResponse";
import { ITekkisPaymentResponse } from "../callback/types/TekkisCreatePaymentResponse";

const createFeePayment = new Hono();

const zPaymentPayload = z.object({
    studentID: z.string(),
    paymentType: z.string(),
});

type IPaymentPayload = z.infer<typeof zPaymentPayload>;

const paymentTypes = ['MONTHLY', 'YEARLY']

createFeePayment.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("json", zPaymentPayload),
    async (c) => {
        const payload = c.get("jwtPayload");

        const bodyPayload = await c.req.json<IPaymentPayload>();

        // THIS IS CASE SENSITIVE
        if (!paymentTypes.includes(bodyPayload.paymentType)) {
            return c.json({
                message: 'Must be either monthly payment or yearly payment',
                success: false,
                data: {}
            }, 400)
        }

        try {
            const userData = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    EmailAddress: true,
                    MobileNumber: true,
                    FullName: true,
                    Children: {
                        select: {
                            StudentID: true,
                            FullName: true,
                            AGClasses: {
                                select: {
                                    Branch: {
                                        select: {
                                            BranchName: true,
                                            Category: {
                                                select: {
                                                    CategoryName: true,
                                                    Organization: {
                                                        select: {
                                                            OrgName: true,
                                                        }
                                                    }
                                                },
                                            }
                                        },
                                    },
                                    BranchPricing: {
                                        select: {
                                            Pricing: true,
                                        },
                                        where: {
                                            PricingType: bodyPayload.paymentType,
                                        },
                                    },
                                },
                            },
                        },
                        where: {
                            StudentID: bodyPayload.studentID,
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

            const paymentStatusInfo = await getChildrenPaymentStatus(
                userData.Children
            );

            const childPaymentInfo = paymentStatusInfo[0]

            if (childPaymentInfo.status === PaymentStatusEnum.paid) {
                return c.json({
                    message: `Payment for this month for ${childPaymentInfo.studentName} has already been paid.`,
                    data: {},
                    success: false,
                });
            }

            const thisMonthPaymentKey = DateTime.now().toFormat('yyyy-MM')

            const paymentData = await createTekkisPayment(
                childPaymentInfo.amount + 2.3,
                childPaymentInfo.studentName,
                userData.EmailAddress,
                `Payment for ${DateTime.now().toFormat('MMMM yyyy')}`,
                bodyPayload.studentID,
                thisMonthPaymentKey,
                bodyPayload.paymentType,
                payload.sub,
            );

            return c.json({
                message: "Created a new payment link",
                data: {
                    refNo: paymentData.response.paymentDetails.payment_ref_no,
                    paymentLink: paymentData.response.paymentDetails.payment_link,
                    // paymentLink: '123',
                    branchName: userData.Children[0].AGClasses[0].Branch?.BranchName ?? 'Unknown branch',
                    fullName: childPaymentInfo.studentName,
                    paymentItems: [
                        {
                            description: `${userData.Children[0].AGClasses[0].Branch?.Category.CategoryName} monthly payment (${DateTime.now().toFormat('MMMM yyyy')})`,
                            amount: childPaymentInfo.amount,
                        }
                    ],
                    subtotal: childPaymentInfo.amount,
                    serviceFee: 2.3,
                },
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

export async function createTekkisPayment(
    price: number,
    customerName: string,
    customerEmail: string,
    description: string,
    studentID: string,
    paymentKey: string, // Refers to 2024-02
    paymentType: string,
    userID: string,
    paymentRefNo: string = nanoid(16)
) {
    const hasher = shaLib.sha256.create();

    hasher.update(
        process.env.TEKKIS_MERCHANT_KEY! + process.env.TEKKIS_SECRET_KEY!
    );

    const data = {
        merchantKey: process.env.TEKKIS_MERCHANT_KEY!,
        signature: hasher.hex(),
        paymentName: customerName,
        paymentEmail: customerEmail,
        paymentDesc: description,
        paymentAmount: price.toFixed(2),
        paymentRefNo,
        // TODO: Add deep link to the app
        paymentRedirectURL: settings.paymentRedirectUrl,
        paymentCallbackURL: `https://22b6-167-71-207-71.ngrok-free.app/v2/payments/callback`,
        // paymentCallbackURL: `https://d9a6-2001-e68-5471-82-b068-32b1-b960-48b5.ngrok-free.app/v2/payments/callback`,
        paymentCustomFields: [
            {
                title: "studentID",
                value: studentID,
            },
            {
                title: "paymentKey",
                value: paymentKey,
            },
            {
                title: "type",
                value: paymentType
            },
            {
                title: "userID",
                value: userID
            }
        ],
    };

    try {

        const dataDB = await prisma.transaction.create({
            data: {
                Name: data.paymentName,
                Email: data.paymentEmail,
                PhoneNumber: "-",
                Desc: data.paymentDesc,
                Type: '-',
                Method: '-',
                UniqueKey: '-',
                RefNo: data.paymentRefNo,
                InvoiceNo: '-',
                Amount: price,
                Status: 'processing',
                PaymentLink: '-',
                Users: {
                    connect: {
                        UserID: userID
                    }
                }
            }
        })

    } catch (error) {
        
        console.log(error);
        
        throw new Error('Failed to save transaction into DB')

    }

    try {
        const response = await axios.post(
            `${settings.tekkisUrl}/payment/addPaymentFromExternal`,
            {
                payload: btoa(JSON.stringify(data)),
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data as ITekkisPaymentResponse;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log(error.response?.data);
            throw new Error(error.response?.data ?? 'Something went wrong')
        } else {
            console.log(error);
            throw error
        }
    }
}

export default createFeePayment;
