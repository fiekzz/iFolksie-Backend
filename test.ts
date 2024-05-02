import { inspect } from "util";
import { prisma } from "./lib/app/prisma";
// import { main } from "./lib/services/AGUploader";
import fs from "fs";
import { DateTime } from "luxon";
import { nanoid } from "nanoid";
import { log } from "handlebars/runtime";
import { ImageStudentsTag } from "./lib/controllers/portfolio/upload";

// const branchIDByClass = await prisma.aGClasses.findFirst({
//     where: {
//         ClassID: 'd72bc5c4-3fcd-4a50-b48c-ba5e8eb22223',
//     },
//     select: {
//         Branch: {
//             select: {
//                 BranchName: true,
//                 Category: {
//                     select: {
//                         Organization: {
//                             select: {
//                                 OrgName: true,
//                             }
//                         }
//                     }
//                 }
//             },
//         }
//     },
// })

// FullName         String
// StudentIC        String
// StudentCategory  String
// Gender           String
// Address          String
// DOB              DateTime
// EffectiveDate    DateTime
// ExpiryDate       DateTime
// PictureURL       AGMedia?
// Citizenship      String
// Immunization     String
// Allergy          String
// PickupPerson     String
// EmergencyContact String
// Status           String

// const data = await prisma.users.findFirst({
//     where: {
//         EmailAddress: 'fikrichuck@gmail.com',
//     },
//     select: {
//         Children: {
//             select: {
//                 FullName: true,
//                 StudentID: true,
//                 PictureURL: {
//                     select: {
//                         MediaURL: true,
//                     },
//                 },
//                 DailyLogs: {
//                     select: {
//                         DLID: true,
//                         Temperature: true,
//                         Timestamp: true,
//                         FUserID: true,
//                         FStudentID: true,
//                         DailyLogsType: true,
//                         UploadedBy: {
//                             select: {
//                                 FullName: true,
//                                 UserID: true,
//                                 ProfilePicture: {
//                                     select: {
//                                         MediaURL: true,
//                                     },
//                                 },
//                             },
//                         },
//                         Medias: {
//                             select: {
//                                 MediaDescription: true,
//                                 MediaURL: true,
//                                 MediaKey: true,
//                                 UploadedAt: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         },
//     },
// });

// const data = await prisma.aGClasses.findMany({
//     select: {
//         ClassID: true,
//         ClassName: true,
//         Branch: {
//             select: {
//                 BranchName: true
//             }
//         }
//     }
// })

// const data = await prisma.conversations.deleteMany({})

// console.log(data);

// const data = await prisma.transaction.deleteMany({})

// console.log(data);

// const data = await prisma.aGClasses.update({
//     where: {
//         ClassID: '6e5556c7-6c84-44cc-98b9-34e09ed77baf'
//     },
//     data: {
//         Subcategory: {
//             connect: {
//                 SubcategoryID: 'b5add0c6-601d-428c-b68a-b21ed106934e'
//             }
//         }
//     }
// })

// const data = await prisma.aGClasses.findFirst({
//     where: {
//         ClassID: '6e5556c7-6c84-44cc-98b9-34e09ed77baf'
//     },
//     include: {
//         Subcategory: true
//     }
// })

// const parsedData = data.map((item) => {
//     return {
//         id: item.ClassID,
//         branch: item.Branch?.BranchName,
//         className: item.ClassName
//     }
// })

// fs.writeFileSync('./ag-classes.json', JSON.stringify(parsedData, null, 2))

// console.log(data);

// const data = await prisma.students.create({
//     data: {
//         StudentID: nanoid(21),
//         FullName: 'Nur Fikhida binti Fikri',
//         StudentIC: '010101-01-0101',
//         StudentCategory: '',
//         Gender: 'Female',
//         Address: 'No 1, Jalan 1, Taman Puchong Perdana, 01000, Kuala Lumpur',
//         DOB: DateTime.now().toJSDate(),
//         EffectiveDate: DateTime.now().toJSDate(),
//         ExpiryDate: DateTime.now().toJSDate(),
//         Citizenship: 'Malaysian',
//         Immunization: 'Complete',
//         Allergy: 'None',
//         PickupPerson: 'Fikri bin Hisham-muddin',
//         EmergencyContact: '+601155046571',
//         Status: 'Registered',
//         Parents: {
//             connect: {
//                 UserID: 'Yx3bIuxzKfkuk6CqNWOGkSjhLXzmOvfx'
//             }
//         }
//     }
// })

// console.log(data);

// const data = await prisma.users.findMany({
//     where:{
//         Role: {
//             some: {
//                 RoleName: 'Parent'
//             }
//         },
//         EmailAddress: 'fikrichuck@gmail.com'
//     },
//     include: {
//         Children: true
//     },
//     take: 10
// })

// console.log(inspect(data, false, 10, true));

// const data = await prisma.roles.create({
//     data: {
//         RoleID: nanoid(21),
//         RoleName: 'Multimedia',
//         Status: 'Not implemented'
//     }
// })

// console.log(data);

// console.log(DateTime.now().toFormat('MMMyyyy'));

// const data = await prisma.portfolio.deleteMany({})

// const data = await prisma.students.findFirst({
//     where: {
//         StudentID: 'Vrx9mg4f7R8pbjCDS7j-Nnc6B5bdIW3A'
//     },
//     select: {
//         Portfolio: {
//             select: {
//                 Medias: true
//             }
//         }
//     }
// })

// const data = await prisma.portfolio.findMany({
//     include: {
//         Medias: true,
//         AGClasses: true

//     }
// })

// console.log(inspect(data, false, 10, true));

// Infant - b5add0c6-601d-428c-b68a-b21ed106934e
// Pretod - 8f86e160-5a5b-4c56-b564-84e978f926b5
// Tod - 78869fa6-dada-48d4-a1e6-337a4f1e4d29

// *INFANT*
// Baby Gym
// Baby Massage
// Early Communication
// Sensory Play
// Early Literacy

// *PRE-TODDLER*
// Early Literacy
// Art & Craft
// Gardening / Little Chef
// Physical Development
// Sensory Play

// *TODDLER*
// Early Literacy
// Early Numeracy
// Little Scientist / STEM Education
// Physical Development / Sensory Play / Art & Craft
// Gardening / Little Chef

// const data = await prisma.$transaction([
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Baby Gym',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: 'b5add0c6-601d-428c-b68a-b21ed106934e'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Baby Massage',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: 'b5add0c6-601d-428c-b68a-b21ed106934e'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Early Communication',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: 'b5add0c6-601d-428c-b68a-b21ed106934e'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Sensory Play',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: 'b5add0c6-601d-428c-b68a-b21ed106934e'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Early Literacy',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: 'b5add0c6-601d-428c-b68a-b21ed106934e'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Early Literacy',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '8f86e160-5a5b-4c56-b564-84e978f926b5'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Art & Craft',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '8f86e160-5a5b-4c56-b564-84e978f926b5'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Gardening / Little Chef',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '8f86e160-5a5b-4c56-b564-84e978f926b5'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Physical Development',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '8f86e160-5a5b-4c56-b564-84e978f926b5'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Sensory Play',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '8f86e160-5a5b-4c56-b564-84e978f926b5'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Early Literacy',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '78869fa6-dada-48d4-a1e6-337a4f1e4d29'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Early Numeracy',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '78869fa6-dada-48d4-a1e6-337a4f1e4d29'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Little Scientist / STEM Education',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '78869fa6-dada-48d4-a1e6-337a4f1e4d29'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Physical Development / Sensory Play / Art & Craft',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '78869fa6-dada-48d4-a1e6-337a4f1e4d29'
//                 }
//             }
//         }
//     }),
//     prisma.portfolioAlbum.create({
//         data: {
//             AlbumName: 'Gardening / Little Chef',
//             AlbumDescription: '',
//             AlbumSubcategory: {
//                 connect: {
//                     SubcategoryID: '78869fa6-dada-48d4-a1e6-337a4f1e4d29'
//                 }
//             }
//         }
//     }),
// ])

// console.log(data);

// import { DateTime } from "luxon";

// main()

// console.log(DateTime.fromFormat('01-Dec-2002', 'dd-MMM-yyyy').toJSDate());

// const user = await prisma.users.findFirst({
//     where: {
//         EmailAddress: 'elyasasmadz@gmail.com'
//     },
//     include: {
//         Role: true
//     }
// })

// norainafarhana88@gmail.com`

// const workerURL = new URL("worker.ts", import.meta.url).href;
// const worker = new Worker(workerURL);

// const file = fs.readFileSync('./vlcsnap-2024-01-23-12h48m45s764.png')

// worker.postMessage({
//     fileName: '123456',
//     file
// });

// const hashed = await Bun.password.hash('12345678')

// const testUser = await prisma.users.update({
//     where: {
//         MobileNumber: '+60195567698'
//     },
//     data: {
//         Status: "Registered",
//         UsersAuth: {
//             create: {
//                 Password: hashed,
//             },
//         },
//     },
// });

// console.log(testUser);

// const studentData = await prisma.students.findMany({
//     where: {
//         StudentID: {
//             in: ["hdaiwhdiua","Cpu3czq3Rb0LuX4jpLDVRbQdeb7wMGmj"],
//         }
//     },
//     include: {
//         Parents: true,
//     }
// })

// console.log(studentData)

// const year_string = 2024
// const month_string = 2

// const year = Number(year_string)
// const month = Number(month_string)

// const startDate = new Date(year, month - 1, 1);
// const endDate = new Date(year, month, 1);

// console.log(`${startDate} until ${endDate}`)

// import fs from 'fs'
// import PDFDocument from 'pdfkit'

// const doc = new PDFDocument()

// const generateReceipt = () => {

//     doc.pipe(fs.createWriteStream('receipt.pdf'))

//     doc.font('Times-Roman').fontSize(24).text('Receipt', 100, 100)

//     doc.end()
// }

// generateReceipt()

const data: ImageStudentsTag[] = [
    {
        imageNo: 0,
        studentIDs: ["SwYLUn7-kYMZOfvDN15NvdQ7tcpvdC99", "Qgq4v8VDCZbDsgKZ8_wPHC4XsNSyivur"]
    },
    {
        imageNo: 1,
        studentIDs: ["Qgq4v8VDCZbDsgKZ8_wPHC4XsNSyivur"]
    }
]

console.log(JSON.stringify(data))