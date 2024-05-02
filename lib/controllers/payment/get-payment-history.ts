import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const paymentHistory = new Hono()

paymentHistory.get('/', jwt({
    secret: process.env.JWT_SECRET!,
}), async (c) => {

    try {
     
        const payload = c.get('jwtPayload');

        const data = await prisma.transaction.findMany({
            where: {
                Email: payload['email'],
            },
            select: {
                Amount: true,
                Status: true,
                Method: true,
                Desc: true,
                CreatedDateTime: true,
            },
            orderBy: {
                CreatedDateTime: 'desc'
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

export default paymentHistory;