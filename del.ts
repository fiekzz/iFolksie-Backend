import { prisma } from "./lib/app/prisma";

const test = await prisma.dailyLogs.deleteMany({
    where: {
        Students: {
            StudentID: 'uYm7hJ1Dd9hYzgI7sdyrGZUGbeRQwhUh'
        }
    }
})

console.log(test);
