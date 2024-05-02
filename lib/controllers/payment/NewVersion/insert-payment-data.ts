import { randomUUID } from "crypto";
import { prisma } from "../../../app/prisma";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { DateTime } from "luxon";

const insertPaymentData = new Hono();

/* 

*/

interface IPayload {
    description: string,
    sub: string
    amount: number
    paymenttype: string
}

insertPaymentData.post(
    "/",
    // jwt({
    //     secret: process.env.JWT_SECRET!,
    // }),
    async (c) => {

        try {

            const body = await c.req.json() as IPayload

            // const payload = c.get('jwtPayload')

            const studentsList = await prisma.students.findMany({
                where: {
                    Parents: {
                        some: {
                            UserID: body.sub
                        }
                    }
                },
                select: {
                    StudentID: true
                }
            })

            if (!studentsList) {
                return c.json({
                    message: "No students found",
                    success: false,
                    data: {}
                });
            }

            let subInvoiceIdList: string[] = []

            for (const _student of studentsList) {

                const studentID = _student.StudentID

                const subInvoiceId = randomUUID()

                await prisma.subInvoice.create({
                    data: {
                        SubinvoiceID: subInvoiceId,
                        Student: {
                            connect: {
                                StudentID: studentID
                            }
                        },
                        Amount: body.amount,
                    }
                })

                subInvoiceIdList.push(subInvoiceId)
            }

            await prisma.invoice.create({
                data: {
                    InvoiceNo: randomUUID(),
                    Description: body.description,
                    PaymentType: body.paymenttype,
                    DueAt: DateTime.now().plus({ days: 7 }).toJSDate(),
                    Users: {
                        connect: {
                            UserID: body.sub
                        }
                    },
                    SubInvoice: {
                        connect: subInvoiceIdList.map((id) => {
                            return {
                                SubinvoiceID: id
                            }
                        })
                    }
                }
            })

            return c.json({
                message: "Payment data inserted successfully",
                success: true,
                data: {}
            });

        } catch (error) {

            console.log(error)

            return c.json({
                message: "An error occurred",
                success: false,
                data: {}
            });

        }

    }
)

insertPaymentData.post(
    "/all-parents",
    async (c) => {

        try {

            const everyUserId = await prisma.users.findMany({
                select: {
                    UserID: true
                }
            })

            var index = 0

            for (var userId of everyUserId) {
                
                const studentList = await prisma.students.findMany({
                    where: {
                        Parents: {
                            some: {
                                UserID: everyUserId[index].UserID
                            }
                        }
                    },
                    select: {
                        StudentID: true,
                        AGClasses: {
                            select: {
                                BranchPricing: {
                                    select: {
                                        Pricing: true
                                    }
                                }
                            }
                        }
                    }
                })

                if (!studentList) {
                    continue
                }

                // let subInvoiceIdList: string[] = []

                // for (const _student of studentList) {

                //     const studentID = _student.StudentID

                //     const subInvoiceId = randomUUID()

                //     await prisma.subInvoice.create({
                //         data: {
                //             SubinvoiceID: subInvoiceId,
                //             Student: {
                //                 connect: {
                //                     StudentID: studentID
                //                 }
                //             },
                //             Amount: _student.AGClasses
                //         }
                //     })

                // }

            }


        } catch (error){

            console.log(error)

            return c.json({
                message: "An error occurred",
                success: false,
                data: {}
            });

        }

    }
)

/* 
Invoice No: ac50a7d8-4ba8-4644-8bc7-84f8a734114e
Invoice ID: e069c5cb-dbe7-4b9d-8de3-e408d6d9b797
Sub Invoices: fcecc3fb-1f63-451f-8310-b8f9edf3bb02
User ID: Yx3bIuxzKfkuk6CqNWOGkSjhLXzmOvfx
*/

/* 
Invoice No: ac50a7d8-4ba8-4644-8bc7-84f8a734114e
Invoice ID: e069c5cb-dbe7-4b9d-8de3-e408d6d9b797
Sub Invoices: 377ad5bb-0f4c-46a2-bfbd-07162ced6a15
User ID: Yx3bIuxzKfkuk6CqNWOGkSjhLXzmOvfx
*/

/* 
Invoice No: 27e6805e-7064-4c80-9292-ec389d47281c
Invoice ID: a03c47e0-ca67-4635-bd2b-df72cfd40c52
Sub Invoices: e0f7d29b-0315-49c9-a67d-3800b6bd5533
User ID: Yx3bIuxzKfkuk6CqNWOGkSjhLXzmOvfx
RefNo: 3DUCnaw0qaAKdv
*/

/* 
Invoice No: 27e6805e-7064-4c80-9292-ec389d47281c
Invoice ID: a03c47e0-ca67-4635-bd2b-df72cfd40c52
Sub Invoices: c6cd5fbe-2802-4915-a7c8-adb6afbb61ad
User ID: Yx3bIuxzKfkuk6CqNWOGkSjhLXzmOvfx
RefNo: 1jQwCg1ALJCAMY
*/

export default insertPaymentData;