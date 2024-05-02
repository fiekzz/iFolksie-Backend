import { prisma } from './lib/app/prisma'

const data = await prisma.aGMedia.findMany({
    where: {
        MediaURL: {
            contains: 'cdn.ag4u.com.my'
        }
    }
})

// await prisma.aGMedia.delete({
//     where: {
//         MediaID: data!.MediaID
//     }
// })

console.log(data);
