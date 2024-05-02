import { DateTime } from 'luxon'
import { prisma } from './lib/app/prisma'

const data = await prisma.invoice.create({
    data: { 
        InvoiceNo: 'AG4U-INV-001',
        Amount: 100,
        Status: 'PENDING',
        IssuedAt: new Date(),
        Description: 'Test payment',
        DueAt: DateTime.now().plus({ days: 7 }).toJSDate(),
        PaymentType: 'MONTHLY',
        Students: {
            connect: [
                {
                    StudentID: '66Gl4rGK-iGvxP8ZN61P_'
                },
                {
                    StudentID: 'xe4a-RAoYN8DDk5uG4QnV'
                }
            ]
        }
    }
})

console.log(data);
