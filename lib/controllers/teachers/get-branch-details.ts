import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

interface IGetBranchID {
    branchId: string;
}

const getBranchDetails = new Hono();

const ALLOWED_ROLES = ["administrator", "branch manager"];

getBranchDetails.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
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

        const body = await c.req.json() as IGetBranchID;

        try {
            const branchDetails = await prisma.branch.findFirst({
                where: {
                    BranchID: body.branchId,
                },
                select: {
                    BranchID: true,
                    BranchName: true,
                    Address: {
                        select: {
                            Address1: true,
                            Address2: true,
                            City: true,
                            PostCode: true,
                            State: true,
                        },
                    },
                    Category: {
                        select: {
                            CategoryName: true,
                        },
                    },
                    AGClasses: {
                        select: {
                            ClassID: true,
                            ClassName: true,
                        }
                    },
                },
            });

            if (!branchDetails) {
                return c.json({
                    message: "Branch not found",
                    data: {},
                    success: false,
                });
            }

            return c.json({
                message: "Branch details",
                data: branchDetails,
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
    }
);


export default getBranchDetails;