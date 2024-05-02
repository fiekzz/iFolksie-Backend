import { inspect } from 'util';
import { prisma } from './lib/app/prisma'

// const data = await prisma.users.findFirst({
//     where: {
//         EmailAddress: 'elyasasmadz@gmail.com'
//     },
//     select: {
//         UserID: true
//     }
// })

// const updateData = await prisma.users.update({
//     where: {
//         UserID: data?.UserID,
//     },
//     data: {
//         AGClasses: {
//             connect: {
//                 ClassID: '6e5556c7-6c84-44cc-98b9-34e09ed77baf'
//             }
//         }
//     }
// })

// console.log(updateData);

const data = await prisma.users.findFirst({
    where: {
        EmailAddress: 'fikrichuck@gmail.com'
    },
    select: {
        FullName: true,
        Children: {
            select: {
                FullName: true,
                AGClasses: {
                    select: {
                        Teachers: {
                            select: {
                                UserID: true,
                                FullName: true,
                            }
                        }
                    }
                }
            }
        }
    }
})

console.log(inspect(data, false, 10, true));

data?.Children.forEach((child) => {

    child.AGClasses.forEach((clas) => {
        clas.Teachers.forEach((teacher) => {
            console.log({
                teacherID: teacher.UserID,
                teacherName: teacher.FullName,
            });
            
        })
    })

})