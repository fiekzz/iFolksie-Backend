import { prisma } from "./lib/app/prisma";

const data = await prisma.aGClasses.create({
    data: {
        ClassName: 'Test Class',
        ClassTimes: '{}',
        Branch: {
            connect: {
                BranchID: '1'
            }
        }
    }
})

console.log(data);