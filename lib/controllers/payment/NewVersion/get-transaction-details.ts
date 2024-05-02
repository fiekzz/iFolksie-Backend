import { prisma } from "../../../app/prisma";
import { Hono } from "hono";
import { jwt } from "hono/jwt";

const getTransactionDetails = new Hono();

getTransactionDetails.get(
    "/:refNo",
    jwt({
        secret: process.env['JWT_SECRET']!,
    }),
    async (c) => {

        try {

            const payload = c.get('jwtPayload')

            const data = await prisma.transactionV2.findFirst({
                where: {
                    RefNo: c.req.param('refNo'),
                    Invoice: undefined
                },
                select: {
                    Desc: true,
                    Amount: true,
                    RefNo: true,
                    Method: true,
                    Type: true,
                    Status: true,
                    CreatedDateTime: true,
                    SubInvoice: {
                        select: {
                            Amount: true,
                            Status: true,
                            Student: {
                                select: {
                                    FullName: true,
                                }
                            }
                        }
                    }
                }
            })

            if (!data) {
                return c.json({
                    message: 'No transaction found for this user.',
                    success: false,
                    data: {}
                }, 400);
            }

            return c.json({
                message: 'OK',
                success: true,
                data: data
            })

        } catch (error) {

            return c.json({
                message: 'An error occurred',
                success: false,
                data: {}
            }, 500)

        }

    }
)

export default getTransactionDetails;