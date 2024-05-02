import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { customAlphabet } from 'nanoid'
// import argon2 from 'argon2'

import AGServerResponse from "../../models/shared/AGResponse";
import { getRuntimeKey } from "hono/adapter";

const zRegistrationTypes = z.object({
    fullName: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
    phoneNumber: z.string(),
})

type IUserRegister = z.infer<typeof zRegistrationTypes>

const registerAuthAPI = new Hono();

registerAuthAPI.post(
    "/",
    zValidator(
        "json",
        zRegistrationTypes
    ),
    async (c) => {

        const payload = await c.req.json<IUserRegister>()

        const nanoid = customAlphabet('1234567890abcdef', 32)

        try {

            const hashed = await Bun.password.hash(payload.password)
            
            return c.json({
                message: nanoid(),
                password: hashed,
            });
            
        } catch (error) {

            console.log(error);
            
            return c.json(AGServerResponse.InternalServerError, 500);

        }
        

    }
);

export default registerAuthAPI;
