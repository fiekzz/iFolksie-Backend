import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { randomUUID } from "crypto";

interface IBranchManagerCheckIn {
    userId: string;
    branchId: string;
    // checkIn: boolean;
}

const branchManagerCheckIn = new Hono();

const ALLOWED_ROLES = ["administrator", "branch manager"];

branchManagerCheckIn.post(
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

        const body = (await c.req.json()) as IBranchManagerCheckIn;

        try {
            const uuid = randomUUID();

            await prisma.$transaction([
                prisma.branchManagerCheckIn.create({
                    data: {
                        CheckInID: uuid,
                        FBranchID: body.branchId,
                        FUserID: body.userId,
                    },
                }),

                prisma.users.update({
                    where: {
                        UserID: payload.sub,
                    },
                    data: {
                        Branch: {
                            connect: {
                                BranchID: body.branchId,
                            },
                        },
                    },
                }),
            ]);

            return c.json({
                message: "Check in status updated successfully",
                data: uuid,
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

export default branchManagerCheckIn;
