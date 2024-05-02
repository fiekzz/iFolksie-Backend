import { prisma } from './lib/app/prisma'

// const data = await prisma.branchPricing.create({
//     data: {
//         Pricing: 450,
//         PricingType: 'MONTHLY',
//         Status: 'ACTIVE',
//         AGClasses: {
//             connect: {
//                 ClassID: '6e5556c7-6c84-44cc-98b9-34e09ed77baf', // boleh jadi infant / pretod / etc
//             }
//         }
//     }
// })

// console.log(data);

// ### YEARLY PRICE ###
const data = await prisma.branchPricing.create({
    data: {
        Pricing: 1234,
        PricingType: 'YEARLY',
        Status: 'ACTIVE',
        AGClasses: {
            connect: {
                ClassID: '6e5556c7-6c84-44cc-98b9-34e09ed77baf', // boleh jadi infant / pretod / etc
            }
        }
    }
})

console.log(data);

