import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { AGUploader } from "../../services/AGUploader";
import { settings } from "../../constants/global-settings";

const getUserInfo = new Hono()

getUserInfo.get('/', jwt({
    secret: process.env.JWT_SECRET!
}), async (c) => {

    const payload = c.get('jwtPayload')

    const data = await prisma.users.findFirst({
        where: {
            UserID: payload.sub
        },
        include: {
            ProfilePicture: {
                select: {
                    MediaURL: true,
                    MediaKey: true,
                    UploadedAt: true
                }
            },
            AGClasses: {
                select: {
                    Branch: {
                        select: {
                            BranchName: true
                        }
                    }
                },
            }
        }
    })

    const excludedKeys = ['ProfilePicture']

    const filteredObject = Object.fromEntries(Object.entries(data!).filter(([k]) => !excludedKeys.includes(k)));

    const branchName = data?.AGClasses[0]?.Branch?.BranchName

    const removeDups = (arr: string[]): string[] => {
        return [...new Set(arr)];
    }

    const TestbranchName = data?.AGClasses.map((item) => item.Branch?.BranchName) as string[]

    const branches = removeDups(TestbranchName)

    if (Boolean(data?.ProfilePicture?.MediaKey)) {

        return c.json({
            message: `Profile for ${payload.email}`,
            data: {
                ...filteredObject,
                profilePicture: data?.ProfilePicture?.MediaURL,
                branches: branches.join(', '),
            },
            success: true,
        })
    }


    return c.json({
        message: `Profile for ${payload.email}`,
        data: {
            ...filteredObject,
            profilePicture: null,
            branches: branches.join(', '),
        },
        success: true,
    })
})

export default getUserInfo