import { prisma } from './lib/app/prisma'
import { nanoid } from 'nanoid'

const data = await prisma.users.create({
    data: {
        EmailAddress: 'aleey@proven.com.my',
        FullName: 'Aleey 2',
        ICNo: '',
        Gender: 'Male',
        UserID: nanoid(16),
        MobileNumber: '+60122619145',
        DOB: new Date('2002-02-22'),
        Address1: 'Skudai',
        State: 'Johor',
        City: 'Johor Bahru',
        ZipCode: '81300',
        Status: 'REGISTERED',
        VehicleInfo: 'JVT',
        Role: {
            connect: {
                // Administrator
                RoleID: 'hACnSjt8mz-lF1yq-g5ek'
            }
        }
    },
})

console.log(data);