import { prisma } from "./lib/app/prisma";

// GET ALL CLASSES IN A BRANCH
const classes = await prisma.branch.findFirst({
    where: {
        BranchID: 'ff810c84-0bed-4747-b7dc-f026e1b74e92'
    },
    select: {
        AGClasses: {
            select: {
                ClassID: true
            }
        }
    }
})

console.log(classes);

// CPIK WILL BE ASSIGNED TO CYBERJAYA CLASSES
const data = await prisma.users.update({
    where: {
        UserID: 'cjTi08uwO8lVZ_1F',
    },
    data: {
        AGClasses: {
            connect: classes?.AGClasses.map((cls) => ({
                ClassID: cls.ClassID,
            }))
        }
    }
})

console.log(data);
