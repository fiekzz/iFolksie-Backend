
import { prisma } from './lib/app/prisma'

const getConversations = await prisma.conversations.findMany({
    where: {
        Users: {
            some: {
                UserID: 'WyWAoqnfgsg2W3bqqa4ECqAd08nj67-f'
            }
        },
    },
    select: {
        ConversationID: true,
        Messages: {
            take: 1
        },
    }
})

const conversationIDsWithNoMessages = getConversations.filter((conv) => conv.Messages.length === 0).map((item) => item.ConversationID)

const response = await prisma.conversations.deleteMany({
    where: {
        ConversationID: {
            in: conversationIDsWithNoMessages
        }
    }
})

console.log(response);
