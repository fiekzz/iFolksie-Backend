import { zValidator } from '@hono/zod-validator'
import { Hono } from "hono";
import { z } from "zod";
import { DateTime } from "luxon";
import type { ITekkisCBResponse } from "../../../callback/types/TekkisCallbackResponse";
import { prisma } from '../../../../app/prisma';

const callbackTekkisV2 = new Hono();

const zCallbackTekkisV2 = z.object({
    payload: z.string(),
});

type ICallbackTekkisV2 = z.infer<typeof zCallbackTekkisV2>;

callbackTekkisV2.post(
    "/",
    zValidator("json", zCallbackTekkisV2),
    async (c) => {

        try {

            const bodyJson = await c.req.json<ICallbackTekkisV2>();
    
            const data = JSON.parse(atob(bodyJson.payload)) as ITekkisCBResponse;
    
            const paymentAmount = parseFloat(data.payment_amount);
    
            const customPayload: { [key: string]: string } = {};
    
            data.payment_custom_fields.forEach((field) => {
                customPayload[field.title] = field.value;
            })
    
            if (data.payment_status === "completed") {
    
                const invoiceNo = customPayload["InvoiceNo"];

                const invoiceId = customPayload["InvoiceID"];

                const subInvoices = customPayload["SubInvoice"].split(',');

                const userId = customPayload["UserID"];

                const checkRef = await prisma.transactionV2.findFirst({
                    where: {
                        RefNo: data.payment_ref_no,
                    }
                })

                if (checkRef) {
                    return c.text("OK")
                }

                await prisma.$transaction([
                    prisma.subInvoice.updateMany({
                        where: {
                            SubinvoiceID: {
                                in: subInvoices
                            }
                        },
                        data: {
                            Status: 'PAID',
                        },
                    }),
                    prisma.transactionV2.create({
                        data: {
                            RefNo: data.payment_ref_no,
                            Name: data.payment_name,
                            Email: data.payment_email,
                            PhoneNumber: data.payment_phone_number,
                            Desc: data.payment_desc,
                            Type: data.payment_type,
                            Method: data.payment_method,
                            UniqueKey: data.payment_unique_key,
                            InvoiceNo: invoiceNo,
                            Amount: parseFloat(data.payment_amount),
                            Status: data.payment_status,
                            PaymentLink: data.payment_link,
                            Users: {
                                connect: {
                                    UserID: userId,
                                }
                            },
                            Invoice: {
                                connect: {
                                    InvoiceID: invoiceId,
                                }
                            },
                            SubInvoice: {
                                connect: subInvoices.map((element) => {
                                    return {
                                        SubinvoiceID: element
                                    }
                                })
                            }
                        }
                    })
                ])
    
            } else if (data.payment_status === 'pending') {

                console.log('Pending payment');
                
            } else if (data.payment_status === 'rejected') {

                console.log('Rejected payment');
            }

            return c.text("OK")

        } catch (error) {

            return c.text("OK")

        }


    }
)

/* 
{
    "title": "InvoiceNo",
    "value": "a3506c5d-e3d2-4b77-977d-a5c331ef7cef"
},
{
    "title": "SubInvoice",
    "value": "5bb37335-e12e-45f1-bf7b-078d02f159b9,f20583ea-6f05-41d7-91ab-043ef26b8b22"
},
{
    "title": "UserID",
    "value": "Yx3bIuxzKfkuk6CqNWOGkSjhLXzmOvfx"
}
*/

export default callbackTekkisV2;