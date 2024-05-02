import { prisma } from "./lib/app/prisma";

// const data = await prisma.users.findFirst({
//     where: {
//         EmailAddress: "elyasasmadz@gmail.com"
//     },
//     include: {
//         Role: true
//     }
// })

// console.log(data);

const data = await prisma.$transaction([
    // prisma.students.update({
    //     where: {
    //         StudentID: '66Gl4rGK-iGvxP8ZN61P_'
    //     },
    //     data: {
    //         AGClasses: {
    //             create: {
    //                 ClassName: 'Test Class',
    //                 ClassTimes: {},
    //                 Branch: {
    //                     connect: {
    //                         BranchID: '77f35993-4070-4cbd-a5a8-c4c497c36dfb'
    //                     }
    //                 }
    //             }
    //         }
    //         // PictureURL: {
    //         //     create: {
    //         //         MediaKey: "profile-photos/elyasasmadz@gmail.com/20230704_111556-min.jpg",
    //         //         MediaURL: "https://cdn.ag4u.com.my/profile-photos/elyasasmadz@gmail.com/20230704_111556-min.jpg",
    //         //         UploadedAt: new Date(),
    //         //         MediaType: 'image-studentpicture',
    //         //         UploadedBy: {
    //         //             connect: {
    //         //                 UserID: 'lLvoKoFhimAysvSqSY4KOelfwV_YdZ5D'
    //         //             }
    //         //         }
    //         //     }
    //         // }
    //     }
    // }),
    prisma.students.update({
        where: {
            StudentID: 'xe4a-RAoYN8DDk5uG4QnV'
        },
        data: {
            AGClasses: {
                connect: {
                    ClassID: '6e5556c7-6c84-44cc-98b9-34e09ed77baf'
                }
                // create: {
                //     ClassName: 'Test Class',
                //     ClassTimes: {},
                //     Branch: {
                //         connect: {
                //             BranchID: '77f35993-4070-4cbd-a5a8-c4c497c36dfb'
                //         }
                //     }
                // }
            }
            // PictureURL: {
            //     create: {
            //         MediaKey: "profile-photos/elyasasmadz@gmail.com/child1.jpeg",
            //         MediaURL: "https://cdn.ag4u.com.my/profile-photos/elyasasmadz@gmail.com/child1.jpeg",
            //         UploadedAt: new Date(),
            //         MediaType: 'image-studentpicture',
            //         UploadedBy: {
            //             connect: {
            //                 UserID: 'lLvoKoFhimAysvSqSY4KOelfwV_YdZ5D'
            //             }
            //         }
            //     }
            // }
        }
    }),
])

console.log(data);
