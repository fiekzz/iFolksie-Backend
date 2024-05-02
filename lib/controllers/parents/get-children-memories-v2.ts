import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { inspect } from "util";

const getChildrenMemoriesV2 = new Hono();

getChildrenMemoriesV2.get(
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
                        },
                    },
                },
            });

            const childMemories = await prisma.portfolio.findMany({
                where: {
                    TaggedClasses: {
                        some: {
                            Students: {
                                some: {
                                    StudentID: {
                                        in: childrenData?.Children.map(
                                            (child) => child.StudentID
                                        ),
                                    }
                                }
                            }
                        }
                    }
                    // Students: {
                    //     some: {
                    //         StudentID: {
                    //             in: childrenData?.Children.map(
                    //                 (child) => child.StudentID
                    //             ),
                    //         },
                    //     },
                    // },
                },
                select: {
                    PortfolioAlbum: {
                        select: {
                            AlbumName: true,
                        }
                    },
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
                                // where: {
                                //     StudentID: {
                                //         in: childrenData?.Children.map(
                                //             (child) => child.StudentID
                                //         ),
                                //     },
                                // },
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
                            MediaState: true,
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

            console.log(inspect(childMemories, false, null, true));

            const approvedMedias = childMemories.map((memory) => {
                return {
                    ...memory,
                    Medias: memory.Medias.filter((media) => media.MediaState === "ACTIVE")
                }
            })
            .filter((memory) => memory.Medias.length > 0);            

            return c.json({
                message: "Successfully fetched children memories",
                data: approvedMedias,
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

export default getChildrenMemoriesV2;