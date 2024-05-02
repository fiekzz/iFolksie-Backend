import { prisma } from "./lib/app/prisma";

const pageKey = 2;
const pageSize = 5;

const data = await prisma.students.findMany({
    take: pageSize,
    skip: pageKey * pageSize,
    select: {
        FullName: true
    }
})

console.log(data);
