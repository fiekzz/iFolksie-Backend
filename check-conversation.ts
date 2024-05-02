import { prisma } from './lib/app/prisma'

const data = await prisma.conversations.findFirst({
    where: {
        Users: {
            some: {
                OR: [
                    {
                        UserID: 'WcDYKouyc26Mr_2Rw25Yd',
                    },
                    {
                        UserID: 'WcDYKouyc26Mr_2Rw25Yd',
                    },
                ],
            },
        },
    },
    select: {
        ConversationID: true,
        Users: {
            select: {
                UserID: true,
                FullName: true,
                MobileNumber: true,
                EmailAddress: true,
                ProfilePicture: {
                    select: {
                        MediaURL: true,
                    },
                },
            },
        },
    },
})

console.log(data);
