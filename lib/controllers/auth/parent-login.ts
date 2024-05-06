import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import AGServerResponse from "../../models/shared/AGResponse";
import { prisma } from "../../app/prisma";
import { decode, verify, sign } from 'hono/jwt'
import { zLoginTypes, type ILoginTypes } from "./types/login-types";
import { getRuntimeKey } from "hono/adapter";
// import argon2 from "argon2";

const parentLoginAuthAPI = new Hono();

// Handle user POST login request
parentLoginAuthAPI.post("/", zValidator("json", zLoginTypes), async (c) => {
    const data = await c.req.json<ILoginTypes>();

    const userCandidate = await prisma.usersAuth.findFirst({
        where: {
            Users: {
                EmailAddress: data.email,
                Role: {
                    some: {
                        RoleName: {
                            in: ['Guardian', 'Administrator']
                        }
                    }
                }
            },
        },
        include: {
            Users: {
                include: {
                    Role: true
                }
            },
        }
    });

    if (!userCandidate) {
        return c.json(
            AGServerResponse.generate({
                isSuccess: false,
                message: "We could not find any parent account associated with this email address. Please double-check your email address and try again.",
            })
        );
    }

    let isPasswordMatch: boolean

    // if (getRuntimeKey() === 'bun') {
        isPasswordMatch = await Bun.password.verify(data.password, userCandidate.Password)
    // }
    // else {
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

    const loginToken = await sign({
        sub: userCandidate.UserID,
        email: userCandidate.Users.EmailAddress,
        role: userCandidate.Users.Role.map((item) => item.RoleName.toLowerCase()),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)
    }, process.env.JWT_SECRET!) 

    return c.json(
        AGServerResponse.generate({
            isSuccess: true,
            message: "Login successful",
            data: {
                token: loginToken
            }
        })
    );
});

export default parentLoginAuthAPI;
