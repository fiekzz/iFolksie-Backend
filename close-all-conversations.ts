import { prisma } from './lib/app/prisma'

const data = await prisma.conversations.updateMany({
    data: {
        ConversationState: 'CLOSED'
    },
    where: {
        ConversationState: 'ACTIVE'
    }
})

console.log(data);