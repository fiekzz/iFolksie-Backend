import { prisma } from './lib/app/prisma'

const admins = await prisma.users.findMany({
    where: {
        Role: {
            some: {
                RoleName: 'Administrator'
            }
        }
    },
    select: {
        UsersAuth: {
            select: {
                FCMToken: true
            }
        }
    }
})

console.log(admins);
