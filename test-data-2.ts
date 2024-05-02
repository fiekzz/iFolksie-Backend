import { prisma } from './lib/app/prisma'

const data = await prisma.dailyLogs.findFirst({
    select: {
        DailyLogsType: {
            select: {
                Type: true,
                Description: true,
                Content: true
            }
        }
    }
})

console.log(data?.DailyLogsType.Content);
console.log(typeof data?.DailyLogsType.Content);
console.log(data?.DailyLogsType.Content?.toString());
console.log(typeof data?.DailyLogsType.Content?.toString());
