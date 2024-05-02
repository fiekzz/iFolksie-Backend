import { Hono } from "hono";
import { prisma } from "../../../app/prisma";
import { jwt } from "hono/jwt";

const studentsWithTeachers = new Hono()

interface ITeacherContactDetails {
    className: string;
    teacherID: string;
    teacherName: string;
    teacherProfilePicture?: string;
    studentID: string;
    studentName: string;
    studentProfilePicture?: string;
}

// const ALLOWED_ROLE = [
//     'administrator',
//     'parent'
// ]

studentsWithTeachers.get('/', jwt({
    secret: process.env.JWT_SECRET!,
}), async (c) => {

    const payload = c.get('jwtPayload')

    // if (!(payload['role'] as string[]).some((userRole) => ALLOWED_ROLE.includes(userRole))) {
    //     return c.json({
    //         success: false,
    //         data: {},
    //         message: 'User does not have enough permission to access this content.'
    //     })
    // }

    try {
        
        const data = await prisma.users.findFirst({
            where: {
                UserID: payload['sub']
            },
            select: {
                FullName: true,
                Children: {
                    select: {
                        StudentID: true,
                        FullName: true,
                        PictureURL: {
                            select: {
                                MediaURL: true
                            }
                        },
                        AGClasses: {
                            select: {
                                ClassName: true,
                                Teachers: {
                                    select: {
                                        UserID: true,
                                        FullName: true,
                                        ProfilePicture: {
                                            select: {
                                                MediaURL: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!data || data?.Children.length === 0) {
            return c.json({
                success: false,
                message: `No child found for ${data?.FullName ?? 'user'}`,
                data: {}
            }, 400)
        }

        const teachersList: ITeacherContactDetails[] = []

        data.Children.forEach((child) => {

            child.AGClasses.forEach((clas) => {
                clas.Teachers.forEach((teacher) => {
                    teachersList.push({
                        className: clas.ClassName,
                        teacherID: teacher.UserID,
                        teacherName: teacher.FullName,
                        teacherProfilePicture: teacher.ProfilePicture?.MediaURL,
                        studentID: child.StudentID,
                        studentName: child.FullName,
                        studentProfilePicture: child.PictureURL?.MediaURL,
                    })
                })
            })

        })

        return c.json({
            success: true,
            message: `Found ${data.Children.length} children with their respective teachers`,
            data: teachersList
        })


    } catch (error) {

        console.log(error);

        return c.json({
            success: false,
            message: (error as Error)?.message ?? 'Something went wrong.',
            data: {}
        }, 500)

    }

})

export default studentsWithTeachers;