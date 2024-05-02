import { prisma } from './lib/app/prisma'
import { nanoid } from 'nanoid'

const defaultPassword = 'AG4U1234'

const hashed = await Bun.password.hash(defaultPassword)

const emails: string[] = [
    'nabilnahar@gmail.com'
]

const promises: any[] = []
const userNotExist: any[] = []

for await (const email of emails) {

    const data = await prisma.users.findFirst({
        where: {
            EmailAddress: email
        },
        select: {
            UserID: true,
            ICNo: true
        }
    })

    if (!data) {
        console.error(`${email} does not exist`);
        userNotExist.push(email)
    }

    promises.push(
        prisma.users.update({
            where: {
                UserID: data?.UserID,
            },
            data: {
                UsersAuth: {
                    create: {
                        Password: hashed,
                    }
                }
            }
        })
    )

}

const results = await prisma.$transaction(promises)

console.log(results);
