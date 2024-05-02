import { prisma } from './lib/app/prisma'

const data = await prisma.students.findFirst({
    where: {
        FullName: {
            contains: 'Fikhidaa'
        }
    },
    select: {
        TaggedInImages: {
            select: {
                MediaURL: true
            }
        }
    }
})

console.log(data);