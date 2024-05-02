import { Hono } from "hono";
import { prisma } from "../../../app/prisma";
import { cors } from "hono/cors";

const getBranchesAPI = new Hono();

getBranchesAPI.use(
    cors()
)

getBranchesAPI.get(
    "/",
    async (c) => {
        try {

            const data = await prisma.branch.findMany({
                select: {
                    BranchID: true,
                    BranchName: true,
                }
            })

            return c.json({
                data,
                message: "Successfully fetched branches",
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

export default getBranchesAPI;
