import { prisma } from './lib/app/prisma'

const data = await prisma.branch.findFirst({
    where: {
        BranchID: '6d8d10b0-b912-4b4c-b440-0062b2cceb1c'
    },
    select: {
        AGClasses: {
            select: {
                ClassID: true
            }
        }
    }
})

const data2 = await prisma.users.update({
    where: {
        UserID: 'Nm9VWhFxv4XvtFZntMEMjN3rh6jxZOzA'
    },
    data: {
        AGClasses: {
            connect: [
                {
                    ClassID: data?.AGClasses[0].ClassID,
                },
                {
                    ClassID: data?.AGClasses[1].ClassID,
                },
                {
                    ClassID: data?.AGClasses[2].ClassID,
                },
                {
                    ClassID: data?.AGClasses[3].ClassID,
                }
            ]
        }
    }
})

console.log(data2);
