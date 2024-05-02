import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const getChildrenMemoriesV3 = new Hono();

getChildrenMemoriesV3.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        const payload = c.get("jwtPayload");

        try {

            // Get the children data
            const childrenData = await prisma.users.findFirst({
                where: {
                    UserID: payload.sub,
                },
                select: {
                    Children: {
                        select: {
                            StudentID: true,
                        }
                    }
                }
            })

            if (!childrenData) {
                return c.json({
                    message: "No children found",
                    success: false,
                    data: {}
                })
            }

            const childMemories = await prisma.portfolio.findMany({
                where: {
                    Students: {
                        some: {
                            StudentID: {
                                in: childrenData?.Children.map(
                                    (child) => child.StudentID
                                )
                            }
                        }
                    }
                },
                select: {
                    PortfolioAlbum: {
                        select: {
                            AlbumName: true,
                        }
                    },
                    Students: {
                        where: {
                            StudentID: {
                                in: childrenData.Children.map(
                                    (child) => child.StudentID
                                )
                            }
                        },
                        select: {
                            FullName: true,
                            StudentID: true,
                            PictureURL: {
                                select: {
                                    MediaURL: true,
                                }
                            },
                            AGClasses: {
                                select: {
                                    ClassName: true,
                                    Branch: {
                                        select: {
                                            BranchName: true
                                        }
                                    }
                                }
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
                        }
                    },
                    Teachers: {
                        select: {
                            UserID: true,
                            FullName: true,
                            ProfilePicture: {
                                select: {
                                    MediaURL: true,
                                }
                            
                            }
                        }
                    }
                }
            })

            return c.json({
                message: "Fetched children memories",
                success: true,
                data: childMemories
            })

        } catch (error) {

            c.json({
                message: "An error occurred",
                success: false,
                data: {}
            })

        }

    }
)

export default getChildrenMemoriesV3;