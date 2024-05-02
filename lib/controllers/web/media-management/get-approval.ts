import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../../app/prisma";
import FCMService from "../../../services/FCMService";
import { MEDIA_ACTIONS } from "./list-medias";

interface IGetApproval {
    mediaId: string;
    status: string;
}

const getApproval = new Hono();

const ALLOWED_ROLES = ["administrator"];

getApproval.post("/", jwt({ secret: process.env.JWT_SECRET! }), async (c) => {
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

    const body = await c.req.json<IGetApproval>();

    if (!MEDIA_ACTIONS.includes(body.status)) {
        return c.json(
            {
                message: "Invalid status",
                success: false,
                data: {},
            },
            400
        );
    }

    try {
        const data = await prisma.aGMedia.update({
            where: {
                MediaID: body.mediaId,
            },
            data: {
                MediaState: body.status.toUpperCase(),
            },
            select: {
                MediaID: true,
                MediaState: true,
                DailyLogs: {
                    select: {
                        DailyLogsType: {
                            select: {
                                Type: true,
                                Description: true,
                                Content: true
                            }
                        },
                        Medias: {
                            select: {
                                _count: true
                            }
                        },
                        Students: {
                            select: {
                                FullName: true,
                                Parents: {
                                    select: {
                                        UsersAuth: {
                                            select: {
                                                FCMToken: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        UploadedBy: {
                            select: {
                                UsersAuth: {
                                    select: {
                                        FCMToken: true
                                    }
                                }
                            }
                        }
                    },
                },
                Portfolio: {
                    select: {
                        Teachers: {
                            select: {
                                UsersAuth: {
                                    select: {
                                        FCMToken: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        // const parentTokens = data.Portfolio?.Students.map((student) => student.Parents.map((parent) => parent?.UsersAuth?.FCMToken)).flat()
        const promises: any[] = []

        // Send ACTIVE / REJECTED notification to teachers
        if (data.Portfolio?.Teachers?.UsersAuth?.FCMToken) {
            // const teacherTokens = data.DailyLogs.Medias._count?.map((media) => media.UploadedBy.AGClasses.Branch.BranchName).flat();
            const teacherFCMToken = data.Portfolio?.Teachers?.UsersAuth?.FCMToken

            promises.push(
                FCMService.sendNotification(
                    teacherFCMToken,
                    {
                        message: `Your media is ${data.MediaState === 'ACTIVE' ? 'APPROVED!' : 'REJECTED.'}`,
                        title: `[Media Approval] Memories`,
                    }
                )
            );
        }

        if (data.DailyLogs) {
            // DailyLogs scope

            // Send ACTIVE / REJECTED notification to teachers
            if (data.DailyLogs?.UploadedBy?.UsersAuth?.FCMToken) {
                // const teacherTokens = data.DailyLogs.Medias._count?.map((media) => media.UploadedBy.AGClasses.Branch.BranchName).flat();
                const teacherFCMToken = data.DailyLogs.UploadedBy.UsersAuth.FCMToken

                const dataJSON = JSON.parse(data.DailyLogs.DailyLogsType.Content?.toString() ?? '{}');

                const activityStr = (!dataJSON['activityType']) ? `${dataJSON['activity']} ${dataJSON['activityType']}` : dataJSON['activity']

                promises.push(
                    FCMService.sendNotification(
                        teacherFCMToken,
                        {
                            message: `Your media is ${data.MediaState === 'ACTIVE' ? 'APPROVED!' : 'REJECTED.'}`,
                            title: `[Media Approval] Diaries - (${activityStr})`,
                        }
                    )
                );
            }

            for (const student of data.DailyLogs.Students) {
                const parentTokens = student.Parents.map((parent) => parent?.UsersAuth?.FCMToken ?? '').filter((item) => item !== '');                

                const dataJSON = JSON.parse(data.DailyLogs.DailyLogsType.Content?.toString() ?? '{}');

                const activityStr = (!dataJSON['activityType']) ? `${dataJSON['activity']} ${dataJSON['activityType']}` : dataJSON['activity']

                console.log(activityStr);

                promises.push(
                    FCMService.broadcastNotification(parentTokens, {
                        message: `Hello mama & papa, ${student.FullName} just ${activityStr} 👶🏻`,
                        title: `Diary - ${data.DailyLogs.DailyLogsType.Type}`,
                    })
                );
            }

            // const parentTokens = data.DailyLogs?.Students.map((student) =>
            //     student.Parents.map((parent) => parent?.UsersAuth?.FCMToken ?? '').filter((item) => item !== '')
            // ).flat();

            // await FCMService.broadcastNotification(parentTokens, {
            //     message: `${data.DailyLogs.Students}`,
            //     title: `Diary - ${data.DailyLogs.DailyLogsType.Type}`,
            // })

        }

        await Promise.all(promises)

        return c.json({
            message: "Media state updated successfully",
            data: {},
            success: true,
        });
    } catch (error) {
        console.log(error);

        return c.json(
            {
                message: "Internal server error",
                success: false,
                data: {},
            },
            500
        );
    }
});

export default getApproval;
