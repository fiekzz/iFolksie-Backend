import { Hono } from "hono";
import { z } from "zod";
import axios from "axios";
import { jwt } from "hono/jwt";
import shaLib from 'js-sha256'
import { ITekkisPaymentResponse } from "../callback/types/TekkisCreatePaymentResponse";

const createPayment = new Hono();

const zPaymentTypes = z.object({
    paymentName: z.string(),
    paymentEmail: z.string().email(),
    paymentDesc: z.string(),
    paymentAmount: z.number(),
    paymentRefNo: z.string(),
    paymentRedirectURL: z.string(),
    paymentCallbackURL: z.string(),
});

// Hono middleware check jwt
createPayment.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const hasher = shaLib.sha256.create();

        hasher.update(
            process.env.TEKKIS_MERCHANT_KEY! + process.env.TEKKIS_SECRET_KEY!
        );

        const data = {
            merchantKey: process.env.TEKKIS_MERCHANT_KEY!,
            signature: hasher.hex(),
            paymentName: "John Smith",
            paymentEmail: "johnsmith@test.com",
            paymentDesc: "Car Rental Payment",
            paymentAmount: "150.00",
            paymentRefNo: "ABC123456",
            paymentRedirectURL: "https://www.google.com",
            paymentCallbackURL: "https://eo7g3u984vhmygx.m.pipedream.net",
            paymentCustomFields: [
                {
                    uid: "1",
                    title: "Parking Date",
                    value: "20/12/22",
                },
            ],
        };

        console.log(data);

        try {
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

            // console.log(response.data);

            const tekkisResponse = response.data as ITekkisPaymentResponse

            return c.json({
                message: "ok",
                data: {
                    paymentLink: tekkisResponse.response.paymentDetails.payment_link,
                },
                success: true
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log(error.response?.data);
            } else {
                console.log(error);
            }

            return c.json({
                message: "error",
            });
        }
    }
);

export { createPayment };
