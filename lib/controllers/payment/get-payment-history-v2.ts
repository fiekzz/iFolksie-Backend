import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { PaymentStatus } from "./ag4u-payment-constants";

const paymentHistoryV2 = new Hono()

paymentHistoryV2.get('/', jwt({
    secret: process.env.JWT_SECRET!,
}), async (c) => {

    try {
     
        const payload = c.get('jwtPayload');

        const data = await prisma.invoice.findMany({
            where: {
                Students: {
                    some: {
                        Parents: {
                            some: {
                                UserID: payload.sub
                            }
                        }
                    }
                },
                Status: PaymentStatus.PAID
            },
            select: {
                Students: {
                    select: {
                        FullName: true,
                        StudentID: true,
                    }
                },
                InvoiceNo: true,
                Amount: true,
                Status: true,
                IssuedAt: true,
                DueAt: true,
                Description: true,
                PaymentType: true,
                Transaction: {
                    select: {
                        Amount: true,
                        Status: true,
                        Method: true,
                        Desc: true,
                        CreatedDateTime: true,
                    }
                }
            }
        })

        return c.json({
            data,
            message: 'Successfully fetched payment history',
            success: true
        })

    } catch (error) {

        console.log(error);
        
        return c.json({
            message: 'Oops, something went wrong. If problem persists, please contact support.',
            errorcode: 'REGISTRATION_ERROR'
        }, 500)

    }

})

export default paymentHistoryV2;