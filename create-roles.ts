import { prisma } from './lib/app/prisma'
import { nanoid } from 'nanoid'

const data = await prisma.roles.createMany({
    data: [
        {
            RoleID: nanoid(16),
            RoleName: 'Administrator',
            Status: 'ACTIVE',
        },
        {
            RoleID: nanoid(16),
            RoleName: 'Caregiver',
            Status: 'ACTIVE',
        },
        {
            RoleID: nanoid(16),
            RoleName: 'Guardian',
            Status: 'ACTIVE',
        },
    ]
})

console.log(data);