import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../../app/prisma";
// import { prisma } from "../../app/prisma";
import AGServerResponse from "../../../models/shared/AGResponse";

const paymentStatus = new Hono()

paymentStatus.get(
    "/:refNo",
    jwt({
        secret: process.env['JWT_SECRET']!,
    }),
    async (c) => {

        try {

            const payload = c.get('jwtPayload')

            const refNo = c.req.param('refNo')

            const data = await prisma.transactionV2.findFirst({
                where: {
                    RefNo: refNo,
                    Users: {
                        UserID: payload.sub
                    }
                },
                select: {
                    Status: true,
                    Amount: true,
                    Desc: true,
                    Method: true,
                    RefNo: true
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

            console.log(error);

            return c.json(AGServerResponse.InternalServerError, 500);

        }

    }
)

export default paymentStatus;