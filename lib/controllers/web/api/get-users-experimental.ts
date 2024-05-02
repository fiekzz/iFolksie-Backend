import { Hono } from "hono";
import { prisma } from "../../../app/prisma";
import { cors } from "hono/cors";

const getUsersExperimental = new Hono()

getUsersExperimental.use(cors())

getUsersExperimental.get('/', async (c) => {

    try {
        
        const users = await prisma.users.findMany({
            where: {
                Role: {
                    some: {
                        RoleName: {
                            in: ['Administrator', 'Staff']
                        }
                    }
                }
            },
            select: {
                FullName: true,
                ProfilePicture: {
                    select: {
                        MediaURL: true
                    }
                }
            }
        })

        return c.json({
            data: {
                users
            },
            success: true,
            message: `Fetched ${users.length} users.`
        })

    } catch (error) {
        
        return c.json({
            data: {},
            success: false,
            message: (error as Error)?.message ?? 'Something went wrong'
        })

    }

})

export default getUsersExperimental