import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import AGServerResponse from "../../models/shared/AGResponse";
import { prisma } from "../../app/prisma";
import { decode, verify, sign } from "hono/jwt";
import { zLoginTypes, type ILoginTypes } from "./types/login-types";
// import argon2 from "argon2";
import { getRuntimeKey } from "hono/adapter";
import AGLogger from "../../services/AGLogger";
import { DateTime } from "luxon";

const teacherLoginAuthAPI = new Hono();

// Handle user POST login request
teacherLoginAuthAPI.post("/", zValidator("json", zLoginTypes), async (c) => {
    const data = await c.req.json<ILoginTypes>();

    const userCandidate = await prisma.usersAuth.findFirst({
        where: {
            Users: {
                EmailAddress: data.email,
                Role: {
                    some: {
                        RoleName: {
                            // equals: 'Staff'
                            in: ["Caregiver", "Administrator"],
                        },
                    },
                },
            },
        },
        include: {
            Users: {
                include: {
                    Role: true,
                    AGClasses: {
                        include: {
                            Subcategory: true,
                        },
                    },
                },
            },
        },
    });

    if (!userCandidate) {
        return c.json(
            AGServerResponse.generate({
                isSuccess: false,
                message:
                    "We could not find any staff account associated with this email address. Please contact us at support@ag4u.com.my if you think this is a mistake.",
            })
        );
    }

    let isPasswordMatch: boolean;

    // if (getRuntimeKey() === "bun") {
        isPasswordMatch = await Bun.password.verify(
            data.password,
            userCandidate.Password
        );
    // } else {
    //     isPasswordMatch = await argon2.verify(
    //         userCandidate.Password,
    //         data.password
    //     );
    // }

    if (!isPasswordMatch)
        return c.json(
            AGServerResponse.generate({
                isSuccess: false,
                message:
                    "Whoops, incorrect email or password provided. Please double-check your login credentials and try again.",
            }),
            401
        );

    const loginToken = await sign(
        {
            sub: userCandidate.UserID,
            email: userCandidate.Users.EmailAddress,
            role: userCandidate.Users.Role.map((item) =>
                item.RoleName.toLowerCase()
            ),
            resp: userCandidate.Users.AGClasses.map((item) => item.ClassID),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        },
        process.env.JWT_SECRET!
    );

    AGLogger.log('AUTH', `User _${userCandidate.Users.EmailAddress}_ has logged in (${DateTime.now().toFormat('dd-MMM-yyyy hh:mm:ss a')})`)

    return c.json(
        AGServerResponse.generate({
            isSuccess: true,
            message: "Login successful",
            data: {
                token: loginToken,
            },
        })
    );
});

export default teacherLoginAuthAPI;
