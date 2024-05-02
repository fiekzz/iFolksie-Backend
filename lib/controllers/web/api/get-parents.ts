import { Hono } from "hono";
import { prisma } from "../../../app/prisma";
import { cors } from "hono/cors";

const getParentsAPI = new Hono();

getParentsAPI.use(
    cors()
)

getParentsAPI.get(
    "/",
    async (c) => {
        try {

            const data = await prisma.users.findMany({
                select: {
                    UserID: true,
                    FullName: true,
                    EmailAddress: true,
                    MobileNumber: true
                },
                where: {
                    Role: {
                        some: {
                            RoleName: 'Parent'
                        }
                    }
                }
            })

            return c.json({
                data,
                message: "Successfully fetched parents",
                success: true
            });

        } catch (error) {
            console.log(error);

            return c.json(
                {
                    data: {},
                    message:
                        "Something went wrong. If problem persists, please contact support.",
                    success: false,
                },
                500
            );
        }
    }
);

export default getParentsAPI;
