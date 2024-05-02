import { nanoid } from "nanoid"
import { prisma } from "./lib/app/prisma"
import { DateTime } from "luxon"

const data = await prisma.students.create({
    data: {
        StudentID: nanoid(21),
        FullName: 'Nur Shafiqah binti Shafiq',
        StudentIC: '010101-01-0101',
        StudentCategory: '',
        Gender: 'Female',
        Address: 'No 1, Jalan 1, Taman Puchong Perdana, 01000, Kuala Lumpur',
        DOB: DateTime.now().toJSDate(),
        EffectiveDate: DateTime.now().toJSDate(),
        ExpiryDate: DateTime.now().toJSDate(),
        Citizenship: 'Malaysian',
        Immunization: 'Complete',
        Allergy: 'None',
        PickupPerson: 'Shafiq Salim',
        EmergencyContact: '+60187792786',
        Status: 'Registered',
        Parents: {
            connect: {
                UserID: 'cjTi08uwO8lVZ_1F'
            }
        }
    }
})

console.log(data);
