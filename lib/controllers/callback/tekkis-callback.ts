import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { ITekkisCBResponse } from "./types/TekkisCallbackResponse";
import { jwt } from "hono/jwt";
import AGRedis from "../../services/AGRedis";
import AGSingleton from "../../services/AGSingleton";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { IPaymentRedisData } from "../payment/get-upcoming-payments";

const tekkisCallback = new Hono();

// payment_status = "pending" | "completed"

const cbResponse = {
    payment_name: "John Smith",
    payment_email: "johnsmith@test.com",
    payment_phone_number: "",
    payment_desc: "Car Rental Payment",
    payment_type: "card",
    payment_method: "Credit Card International",
    payment_unique_key:
        "m2KnD5KUMSI9tUegxKjTCilgpYBaNBQdaxaXgiUrLIGoIC1zYdtpbyMWQk4AZA88pNi4w4U7bTW53aT7SrvHtImW56XmOT6T0bqbW2Jt9vEgwUAmqMebCFSiu5W9QqZdK9a91C3bGWUo8A0w9HEr0E9NHBqDknj1HjOsDmt0NoFktOOml1nqKEgxrMHv8w",
    payment_ref_no: "UpiXAvWsyMKc2z",
    payment_invoice_no: "ABC123456",
    payment_amount: "150.0000",
    payment_status: "completed",
    payment_created_datetime: "2024-01-21 22:25:45",
    payment_callback_url: "https://eo7g3u984vhmygx.m.pipedream.net",
    payment_redirect_url: "https://www.google.com",
    payment_link:
        "https://checkout-staging.tpay.com.my/checkout/checkout?hasLoading=true&uniqueToken=m2KnD5KUMSI9tUegxKjTCilgpYBaNBQdaxaXgiUrLIGoIC1zYdtpbyMWQk4AZA88pNi4w4U7bTW53aT7SrvHtImW56XmOT6T0bqbW2Jt9vEgwUAmqMebCFSiu5W9QqZdK9a91C3bGWUo8A0w9HEr0E9NHBqDknj1HjOsDmt0NoFktOOml1nqKEgxrMHv8w",
    payment_custom_fields: [
        {
            title: "Parking Date",
            value: "20/12/22",
        },
    ],
};

const zTKCallbackTypes = z.object({
    payload: z.string(),
});

type ITKCallbackTypes = z.infer<typeof zTKCallbackTypes>;

tekkisCallback.post("/", zValidator("json", zTKCallbackTypes), async (c) => {
    try {
        const p = await c.req.json<ITKCallbackTypes>();

        const data = JSON.parse(atob(p.payload)) as ITekkisCBResponse;

        // const redis = await AGSingleton.getInstance().getRedis();

        const paymentAmt = parseFloat(data.payment_amount);

        console.log(data);

        const customPayload: { [key: string]: string } = {};

        data.payment_custom_fields.forEach((field) => {
            customPayload[field.title] = field.value;
        });

        // console.log(customPayload);

        if (data.payment_status === "completed") {
            if (
                Boolean(customPayload["studentID"]) ||
                Boolean(customPayload["key"]) ||
                Boolean(customPayload["type"])
            ) {
                if (customPayload["type"] === "MONTHLY") {
                    // const jsonData = await redis.get(
                    //     customPayload["studentID"]
                    // );

                    // const data = JSON.parse(
                    //     jsonData ?? "{}"
                    // ) as IPaymentRedisData;

                    // await redis.set(
                    //     customPayload["studentID"],
                    //     JSON.stringify({
                    //         ...data,
                    //         paymentMonthlyKey: customPayload["paymentKey"],
                    //     } as IPaymentRedisData)
                    // );
                } else if (customPayload["type"] === "YEARLY") {
                    // const jsonData = await redis.get(
                    //     customPayload["studentID"]
                    // );

                    // const data = JSON.parse(
                    //     jsonData ?? "{}"
                    // ) as IPaymentRedisData;

                    // await redis.set(
                    //     customPayload["studentID"],
                    //     JSON.stringify({
                    //         ...data,
                    //         paymentYearlyKey: customPayload["paymentKey"],
                    //     } as IPaymentRedisData)
                    // );
                }
            } else {
                console.log("No studentID or key found from tekkis response");
            }
        } else if (data.payment_status === "pending") {
            console.log("Pending payment");
        } else if (data.payment_status === "rejected") {
            console.log("Payment rejected");
        }

        const _updateData = {
            Name: data.payment_name,
            Email: data.payment_email,
            PhoneNumber: data.payment_phone_number,
            Desc: data.payment_desc,
            Type: data.payment_type,
            Method: data.payment_method,
            UniqueKey: data.payment_unique_key,
            RefNo: data.payment_ref_no,
            InvoiceNo: data.payment_invoice_no,
            Amount: paymentAmt,
            Status: data.payment_status,
            PaymentLink: data.payment_link,
            CreatedDateTime: DateTime.fromFormat(
                data.payment_created_datetime,
                "yyyy-MM-dd HH:mm:ss"
            ).toJSDate(),
        };

        // Save transaction into DB
        // const prismaData = await prisma.transaction.upsert({
        //     where: {
        //         RefNo: data.payment_ref_no,
        //     },
        //     update: {
        //         ..._updateData,
        //         Users: {
        //             connect: {
        //                 UserID: customPayload["userID"],
        //             },
        //         },
        //     },
        //     create: {
        //         ..._updateData,
        //         Users: {
        //             connect: {
        //                 UserID: customPayload["userID"],
        //             },
        //         },
        //     },
        // });

        return c.text("OK");

        // return c.json({
        //     success: true,
        //     message: "OK",
        //     data: {},
        // });
    } catch (error) {
        console.log(error);

        return c.text("OK");

        // return c.json({
        //     message: (error as Error)?.message ?? "Internal server error",
        //     success: false,
        //     data: {},
        // });
    }
});

export default tekkisCallback;
