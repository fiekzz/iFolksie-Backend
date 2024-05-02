import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { Prisma } from "@prisma/client";

const getChildrenMemories = new Hono();

getChildrenMemories.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const payload = c.get("jwtPayload");

        try {
            const childrenData = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    Children: {
                        select: {
                            StudentID: true,
                            AGClasses: {
                                select: {
                                    ClassID: true,
                                },
                            },
                            // Portfolio: {
                            //     select: {
                            //         TaggedClasses: {
                            //             select: {
                            //                 ClassID: true,
                            //                 ClassName: true
                            //             }
                            //         },
                            //         Teachers: {
                            //             select: {
                            //                 UserID: true,
                            //                 FullName: true,
                            //                 ProfilePicture: {
                            //                     select: {
                            //                         MediaURL: true
                            //                     }
                            //                 }
                            //             }
                            //         },
                            //         Timestamp: true,
                            //         Description: true,
                            //         Medias: {
                            //             select: {
                            //                 MediaURL: true
                            //             }
                            //         }
                            //     }
                            // }
                        },
                    },
                },
            });

            const childMemories = await prisma.portfolio.findMany({
                where: {
                    Students: {
                        some: {
                            StudentID: {
                                in: childrenData?.Children.map(
                                    (child) => child.StudentID
                                ),
                            },
                        },
                    },
                },
                select: {
                    TaggedClasses: {
                        select: {
                            ClassName: true,
                            Students: {
                                select: {
                                    PictureURL: {
                                        select: {
                                            MediaURL: true,
                                        },
                                    },
                                    StudentID: true,
                                    FullName: true,
                                },
                                where: {
                                    StudentID: {
                                        in: childrenData?.Children.map(
                                            (child) => child.StudentID
                                        ),
                                    },
                                },
                            },
                            Branch: {
                                select: {
                                    BranchName: true,
                                },
                            },
                        },
                    },
                    Description: true,
                    PortfolioID: true,
                    Timestamp: true,
                    Medias: {
                        select: {
                            MediaURL: true,
                            MediaType: true,
                        },
                    },
                    Teachers: {
                        select: {
                            UserID: true,
                            FullName: true,
                            ProfilePicture: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                        },
                    },
                },
            
            })

            return c.json({
                message: "Successfully fetched children memories",
                data: childMemories,
                success: true,
            });

            const childWithClasses = new Map<string, string[]>();

            // MIGHT HAVE SOME BUGS DUE TO 1 STUDENT HAVING MULTIPLE CLASSES
            // const classIDs = childrenData?.Children.map(
            //     (child) => child.AGClasses[0].ClassID
            // );

            childrenData?.Children.forEach((child) => {
                child.AGClasses.forEach((agClass) => {
                    if (childWithClasses.has(child.StudentID)) {
                        childWithClasses.set(child.StudentID, [
                            ...childWithClasses.get(child.StudentID)!,
                            agClass.ClassID,
                        ]);
                    } else {
                        childWithClasses.set(child.StudentID, [
                            agClass.ClassID,
                        ]);
                    }
                });
            });

            const promises: Prisma.PrismaPromise<any>[] = [];
            const promiseStudentID: string[] = [];

            const cwcObj = Object.fromEntries(childWithClasses.entries());

            const kv = Object.entries(cwcObj);

            kv.forEach(async ([studentID, classIDs]) => {
                promiseStudentID.push(studentID);
                promises.push(
                    prisma.portfolio.findMany({
                        where: {
                            TaggedClasses: {
                                some: {
                                    ClassID: {
                                        in: classIDs,
                                    },
                                },
                            },
                        },
                        select: {
                            TaggedClasses: {
                                select: {
                                    ClassName: true,
                                    Students: {
                                        select: {
                                            PictureURL: {
                                                select: {
                                                    MediaURL: true,
                                                },
                                            },
                                            StudentID: true,
                                            FullName: true,
                                        },
                                        where: {
                                            StudentID: studentID,
                                        },
                                    },
                                    Branch: {
                                        select: {
                                            BranchName: true,
                                        },
                                    },
                                },
                            },
                            PortfolioAlbum: {
                                select: {
                                    AlbumName: true,
                                    AlbumID: true,
                                    AlbumCover: {
                                        select: {
                                            MediaURL: true,
                                        },
                                    },
                                },
                            },
                            Description: true,
                            PortfolioID: true,
                            Timestamp: true,
                            Medias: {
                                select: {
                                    MediaURL: true,
                                    MediaType: true,
                                },
                            },
                            Teachers: {
                                select: {
                                    UserID: true,
                                    FullName: true,
                                    ProfilePicture: {
                                        select: {
                                            MediaURL: true,
                                        },
                                    },
                                },
                            },
                        },
                    })
                );
            });

            const dbStudentTag = await prisma.portfolio.findMany({
                where: {
                    Students: {
                        some: {
                            StudentID: {
                                in: promiseStudentID,
                            },
                        },
                    },
                },
                select: {
                    TaggedClasses: {
                        select: {
                            ClassName: true,
                            Students: {
                                select: {
                                    PictureURL: {
                                        select: {
                                            MediaURL: true,
                                        },
                                    },
                                    StudentID: true,
                                    FullName: true,
                                },
                                where: {
                                    StudentID: {
                                        in: promiseStudentID,
                                    },
                                },
                            },
                            Branch: {
                                select: {
                                    BranchName: true,
                                },
                            },
                        },
                    },
                    Description: true,
                    PortfolioID: true,
                    Timestamp: true,
                    Medias: {
                        select: {
                            MediaURL: true,
                            MediaType: true,
                        },
                    },
                    Teachers: {
                        select: {
                            UserID: true,
                            FullName: true,
                            ProfilePicture: {
                                select: {
                                    MediaURL: true,
                                },
                            },
                        },
                    },
                },
            });

            const data = await Promise.all(promises);

            const taggedByClass: { [k: string]: any } = {};

            const returnData: any[] = [];

            promiseStudentID.forEach((studentID, index) => {
                returnData.push(
                    ...data[index],
                    ...dbStudentTag.filter((dbStu) =>
                        dbStu.TaggedClasses[0]?.Students.some(
                            (stu) => stu.StudentID === studentID
                        )
                    )
                );
            });

            // const memoriesByClasses

            return c.json({
                message: "Successfully fetched children memories",
                data: returnData,
                success: true,
            });
        } catch (error) {
            console.log(error);

            return c.json(
                {
                    message:
                        "Something went wrong while fetching children memories. Please try again later.",
                    data: {},
                    success: false,
                },
                500
            );
        }
    }
);

export default getChildrenMemories;
