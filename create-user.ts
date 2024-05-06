import { prisma } from './lib/app/prisma'
import { nanoid } from 'nanoid'

const data = await prisma.users.create({
    data: {
        EmailAddress: 'fikrichuck@gmail.com',
        FullName: 'Fikri',
        ICNo: '',
        Gender: 'Male',
        UserID: nanoid(16),
        MobileNumber: '+601155046571',
        DOB: new Date('2002-07-18'),
        Address1: 'Puchong',
        State: 'Selangor',
        City: 'Johor Bahru',
        ZipCode: '47130',
        Status: 'REGISTERED',
        VehicleInfo: 'JPT',
        Role: {
            connect: {
                // Administrator
                // RoleID: 'x205Lasq16UwrmFG'
                // Guardian
                RoleID: '8obCBPxvyZST3KyL'
            }
        },
        UsersAuth: {
            create: {
                Password: await Bun.password.hash('aleeyhensem')
            }
        }
    },
})

console.log(data);