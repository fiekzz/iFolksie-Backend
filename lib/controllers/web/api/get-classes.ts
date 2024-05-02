import { Hono } from "hono";
import { prisma } from "../../../app/prisma";
import { cors } from "hono/cors";

const getClassesAPI = new Hono();

getClassesAPI.use(
    cors()
)

getClassesAPI.get(
    "/",
    async (c) => {
        
        const id = c.req.query('branchID')
        
        try {

            if (!id) {
                return c.json({
                    data: {},
                    message: "A required parameter is missing",
                    success: false
                }, 400)
            }

            const branchInfo = await prisma.branch.findFirst({
                where: {
                    BranchID: id,
                },
                select: {
                    BranchName: true
                }
            })

            const data = await prisma.aGClasses.findMany({
                where: {
                    Branch: {
                        BranchID: id
                    }
                },
                select: {
                    ClassID: true,
                    ClassName: true,
                }
            })

            return c.json({
                data,
                message: `Successfully fetched classes for branch ${branchInfo?.BranchName}`,
                success: true
            });

        } catch (error) {
            console.log(error);

            return c.json(
                {
                    data: {},
                    message:
                        "Something went wrong. If problem persists, please contact support.",
                    success: false,
                },
                500
            );
        }
    }
);

export default getClassesAPI;
