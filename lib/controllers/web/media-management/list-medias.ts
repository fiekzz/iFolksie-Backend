import { Hono } from "hono";
import { jwt } from "hono/jwt";
import AGServerResponse from "../../../models/shared/AGResponse";
import { prisma } from "../../../app/prisma";

const listMediasWeb = new Hono();

const ALLOWED_ROLES = ["administrator"];

export const MEDIA_ACTIONS = [
    'ACTIVE',
    'REJECTED',
    'PENDING'
]

listMediasWeb.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        try {
            const payload = c.get("jwtPayload");

            const role = payload["role"] as string[];

            const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r));

            if (!isAllowed) {
                return c.json(
                    {
                        message: "You are not allowed to access this resource",
                        success: false,
                        data: {},
                    },
                    401
                );
            }

            const data = await prisma.aGMedia.findMany({
                where: {
                    MediaState: 'PENDING'
                },
                select: {
                    MediaID: true,
                    MediaURL: true,
                    MediaType: true,
                    DailyLogs: {
                        select: {
                            Students: {
                                select: {
                                    FullName: true,
                                    AGClasses: {
                                        select: {
                                            Branch: {
                                                select: {
                                                    BranchName: true,
                                                }
                                            }
                                        }
                                    },
                                }
                            },
                            UploadedBy: {
                                select: {
                                    FullName: true,
                                    AGClasses: {
                                        select: {
                                            ClassName: true,
                                            Branch: {
                                                select: {
                                                    BranchName: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            Timestamp: true,
                            DailyLogsType: {
                                select: {
                                    Content: true,
                                }
                            }
                        }
                    },
                    Portfolio: {
                        select: {
                            // Students: {
                            //     select: {
                            //         FullName: true,
                            //         AGClasses: {
                            //             select: {
                            //                 Branch: {
                            //                     select: {
                            //                         BranchName: true,
                            //                     }
                            //                 }
                            //             }
                            //         }
                            //     }
                            // },
                            TaggedClasses: {
                                select: {
                                    ClassName: true,
                                    Branch: {
                                        select: {
                                            BranchName: true,
                                        }
                                    }
                                }
                            },
                            Timestamp: true,
                            Description: true,
                            Teachers: {
                                select: {
                                    FullName: true,
                                    AGClasses: {
                                        select: {
                                            ClassName: true,
                                            Branch: {
                                                select: {
                                                    BranchName: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                }
            });

            // const dailylogsData = await prisma.dailyLogs.findMany({
            //     where: {
            //         Medias: {
            //             some: {
            //                 MediaState: 'PENDING'
            //             }
            //         }
            //     },
            //     select: {
            //         DailyLogsType: {
            //             select: {
            //                 Type: true,
            //                 Content: true,
            //                 Description: true,
            //             }
            //         },
            //         DLID: true,
            //         Students: {
            //             select: {
            //                 FullName: true,
            //                 AGClasses: {
            //                     select: {
            //                         Branch: {
            //                             select: {
            //                                 BranchID: true,
            //                                 BranchName: true,
            //                             }
            //                         }
            //                     }
            //                 }
            //             }
            //         },
            //         Timestamp: true,
            //         Medias: {
            //             select: {
            //                 MediaURL: true,
            //                 MediaState: true,
            //             }
            //         },
            //         UploadedBy: {
            //             select: {
            //                 FullName: true,
                            
            //             }
            //         }
            //     }
            // })

            // const portfolioData = await prisma.portfolio.findMany({
            //     where: {
            //         Medias: {
            //             some: {
            //                 MediaState: 'PENDING'
            //             }
            //         }
            //     },
            //     select: {
            //         PortfolioID: true,
            //         Description: true,
            //         Timestamp: true,
            //         Medias: {
            //             select: {
            //                 MediaURL: true,
            //                 MediaState: true,
            //             }
            //         },
            //         Teachers: {
            //             select: {
            //                 FullName: true,
            //                 AGClasses: {
            //                     select: {
            //                         Branch: {
            //                             select: {
            //                                 BranchID: true,
            //                                 BranchName: true,
            //                             }
            //                         }
            //                     }
            //                 }
            //             }
            //         },   
            //     }
            // })

            // const data = {
            //     dailylogsData,
            //     portfolioData
            // }

            return c.json({
                message: "OK",
                data,
                success: true,
            });
        } catch (error) {
            console.log(error);

            return c.json(AGServerResponse.InternalServerError, 500);
        }
    }
);

export default listMediasWeb;
