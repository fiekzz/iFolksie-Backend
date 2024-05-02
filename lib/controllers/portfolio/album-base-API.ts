import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { AGMediaStateEnum } from "../dailylogs/upload";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { AGUploader } from "../../services/AGUploader";
import { compressImage } from "../../services/AGImageCompress";

const memoriesListAPI = new Hono()

memoriesListAPI.get('/', jwt({
    secret: process.env.JWT_SECRET!
}), async (c) => {

    try {

        const payload = c.get('jwtPayload')

        const teacherClasses = payload['resp']

        const teacherBranchID = await prisma.users.findFirst({
            where: {
                UserID: payload.sub
            },
            select: {
                AGClasses: {
                    select: {
                        ClassID: true,
                    },
                    where: {
                        Teachers: {
                            some: {
                                UserID: payload.sub
                            }
                        }
                    }
                }
            }
        })

        // const teacherBranch = teacherBranchID?.AGClasses[0].Branch?.BranchID

        if (teacherBranchID?.AGClasses.length === 0 ?? true) {
            return c.json({
                message: "No branch found for the teacher",
                success: false,
                data: {}
            });
        }

        const data = await prisma.portfolioAlbum.findMany({
            where: {
                AlbumSubcategory: {
                    AGClasses: {
                        some: {
                            ClassID: {
                                in: teacherBranchID?.AGClasses.map((item) => item.ClassID)
                            }
                        }
                    }
                }
            },
            select: {
                AlbumName: true,
                AlbumID: true,
                AlbumCover: {
                    select: {
                        MediaURL: true,
                    }
                },
                AlbumSubcategory: {
                    select: {
                        AGClasses: {
                            select: {
                                ClassName: true,
                                ClassID: true,
                            },
                            where: {
                                ClassID: {
                                    in: teacherBranchID?.AGClasses.map((item) => item.ClassID)
                                }
                            }
                        },
                    }
                },
                Portfolio: {
                    select: {
                        PortfolioID: true,
                        Medias: {
                            select: {
                                MediaURL: true
                            },
                            where: {
                                MediaState: {
                                    in: [
                                        AGMediaStateEnum.ACTIVE,
                                    ]
                                }
                            }
                        },
                    },
                    take: 1,
                    orderBy: {
                        Timestamp: 'desc'
                    }
                },
            }
        });

        return c.json({
            success: true,
            message: 'Total memories list is ' + data.length,
            data,
        })
        
    } catch (error) {
        
        console.log(error)
        
        return c.json({
            message: "Something went wrong",
            data: {
                error: (error as Error)?.message ?? "Internal error occurred",
            },
            success: false,
        });

    }


});

export const STAFF_MEDIA_VIEWABLE_ROLE = [
    'administrator',
    'staff',
    'branch manager'
]

memoriesListAPI.get('/fetch/:classID/:albumID', jwt({
    secret: process.env.JWT_SECRET!
}), async (c) => {

    

})

memoriesListAPI.get('/:classID/:albumID', jwt({
    secret: process.env.JWT_SECRET!
}), async (c) => {
    const albumID = c.req.param('albumID')
    const classID = c.req.param('classID')

    const payload = c.get('jwtPayload')

    const isStaff = (payload['role'] as string[]).some((userRole) => STAFF_MEDIA_VIEWABLE_ROLE.includes(userRole))

    const albumDetails = await prisma.portfolioAlbum.findFirst({
        where: {
            AlbumID: albumID
        },
        select: {
            AlbumID: true,
            AlbumName: true,
            AlbumCover: {
                select: {
                    MediaURL: true,
                }
            }
        }
    })
    const portfolios = await prisma.portfolio.findMany({
        where: {
            AlbumID: albumID,
            TaggedClasses: {
                some: {
                    ClassID: classID
                },
            },
            Medias: {
                some: {
                    MediaState: {
                        in: isStaff ? [
                            AGMediaStateEnum.ACTIVE,
                            AGMediaStateEnum.PENDING,
                        ] : [
                            AGMediaStateEnum.ACTIVE
                        ]
                    },
                }
            }
        },
        select: {
            Description: true,
            PortfolioID: true,
            Timestamp: true,
            Medias: {
                select: {
                    MediaURL: true,
                    TaggedStudents: {
                        select: {
                            StudentID: true,
                            FullName: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true
                                }
                            },
                        }
                    },
                    UploadedBy: {
                        select: {
                            FullName: true,
                            // Branch: {
                            //     select: {
                            //         BranchName: true
                            //     },
                            // },
                            ProfilePicture: {
                                select: {
                                    MediaURL: true,
                                }
                            },
                            AGClasses: {
                                select: {
                                    Branch: {
                                        select: {
                                            BranchName: true
                                        }
                                    },
                                },
                                take: 1
                            }
                        }
                    },
                    MediaType: true,
                    MediaState: true
                }
            },
            // Students: {
            //     select: {
            //         StudentID: true,
            //         FullName: true,
            //     }
            // },
            // Students: {
            //     select: {
            //         StudentID: true,
            //         FullName: true,
            //     }
            // },
            TaggedClasses: {
                select: {
                    ClassName: true
                },
            }
        },
        orderBy: {
            Timestamp: 'desc'
        }
    })

    const studentsCount = await prisma.students.count({
        where: {
            AGClasses: {
                some: {
                    ClassID: classID
                }
            }
        }
    })

    const data = {
        albumDetails,
        portfolios,
        studentsCount
    }

    // "PortfolioID": "4afea6e0-77e8-493c-ac31-44b304d7cf5e",
    // "Description": "Hello World",
    // "Timestamp": "2024-02-04T09:07:00.029Z",
    // "AlbumID": "2adf3aa2-0175-4d51-887e-2a8920e39e95",
    // "FTeacherID": "AiH4ZwKLXNUmta4l4mr8htzzqfUbUQsX",
    // "FClassID": "d72bc5c4-3fcd-4a50-b48c-ba5e8eb22223",
    // "AGClasses": {
    //     "ClassName": "4 Lavender"
    // }

    return c.json({
        message: `${data.portfolios.length} memories found`,
        success: true,
        data: data
    });
})

export { memoriesListAPI }