import { inspect } from "util";
import { prisma } from "./lib/app/prisma";

const teacherBranch = await prisma.users.findFirst({
    where: {
        EmailAddress: 'shafiqsalim1601@gmail.com'
    },
    // select: {
    //     AGClasses: {
    //         select: {
    //             Branch: {
    //                 select: {
    //                     BranchID: true,
    //                     BranchName: true
    //                 }
    //             }
    //         },
    //         take: 1
    //     }
    // }
})

// const data2 = await prisma.students.findMany({
//     where: {
//         AGClasses: {
//             some: {
//                 Branch: {
//                     BranchID: data?.AGClasses[0].Branch?.BranchID
//                 }
//             }
//         }
//     }
// })

console.log(inspect(teacherBranch, false, 10, true));

