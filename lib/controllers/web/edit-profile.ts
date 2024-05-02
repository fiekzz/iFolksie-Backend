import { randomUUID } from "crypto";
import { prisma } from "../../app/prisma";
import { Hono } from "hono";
import { jwt } from "hono/jwt";

const editProfileUser = new Hono()

interface IPayload {
    fullName: string
    userId: string
}

function capitalizeFirstLetter(input: string) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}

editProfileUser.get(
    "current-name/:uid",
    jwt({
        secret: process.env.JWT_SECRET!
    }),
    async (c) => {

        try {

            const param = c.req.param('uid')

            const user = await prisma.users.findFirst({
                where: {
                    UserID: param
                },
                select: {
                    FullName: true
                }
            })

            return c.json({
                message: "name fetched",
                success: true,
                data: user
            })
            
        } catch (error) {

            console.log(error)

            return c.json({
                message: "An error occurred",
                success: false,
                data: {}
            });
            
        }

    }
)

editProfileUser.get(
    "get-user/:fullname",
    jwt({
        secret: process.env.JWT_SECRET!
    }),
    async (c) => {

        try {

            var fullName: string

            try {

                fullName = capitalizeFirstLetter(c.req.param('fullname'))

            } catch (error) {

                return c.json({
                    message: "Please provide name",
                    success: false,
                    data: {}
                })

            }

            const users = await prisma.users.findMany({
                where: {
                    FullName: {
                        contains: fullName
                    }
                },
            })

            if (!users) {
                return c.json({
                    message: "No user found",
                    success: true,
                    data: {}
                })
            }

            return c.json({
                message: "Users successfully fetched",
                success: true,
                data: users
            })
            

        } catch (error) {

            console.log(error)

            return c.json({
                message: "An error occurred",
                success: false,
                data: {}
            });

        }

    }
)

editProfileUser.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!
    }),
    async (c) => {

        try {

            var body

            try {

                body = await c.req.json() as IPayload

            } catch (error) {

                if (!body) {
                    return c.json({
                        message: "Please provide required fields",
                        success: false,
                        data: {}
                    })
                }

            }

            if (!body.fullName || !body.userId) {

                return c.json({
                    message: "Please provide required fields",
                    success: false,
                    data: {}
                })

            }

            const checkUser = await prisma.users.findFirst({
                where: {
                    UserID: body.userId
                },
            })

            if (!checkUser) {
                return c.json({
                    message: "User not found",
                    success: false,
                    data: {}
                })
            }

            await prisma.users.update({
                where: {
                    UserID: body.userId
                },
                data: {
                    FullName: body.fullName
                }
            })

            return c.json({
                message: "User data updated successfully",
                sucess: true,
                data: {}
            })

        } catch (error) {

            console.log(error)

            return c.json({
                message: "An error occurred",
                success: false,
                data: {}
            });
        }

    }
)

export default editProfileUser