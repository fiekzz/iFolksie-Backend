import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { prisma } from "../../app/prisma";

const deleteAccountAPI = new Hono();

const zDeleteAccount = z.object({
    userID: z.string(),
});

type IDeleteAccount = z.infer<typeof zDeleteAccount>;

deleteAccountAPI.get(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        try {

            const data = await prisma.accountDeleteRequest.findFirst({
                where: {
                    UserID: c.get("jwtPayload").sub,
                }
            })

            return c.json({
                data: {
                    status: data?.Status
                },
                message: "Successfully fetched account deletion status",
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

deleteAccountAPI.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    zValidator("json", zDeleteAccount),
    async (c) => {
        // Delete the account here

        const { userID } = await c.req.json<IDeleteAccount>();

        try {
            const data = await prisma.accountDeleteRequest.create({
                data: {
                    UserID: userID,
                    Reason: "",
                    Status: "Pending",
                },
            });

            console.log(data);

            return c.json({
                data: {},
                message: "Account deletion request sent",
                success: true,
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

export default deleteAccountAPI;
