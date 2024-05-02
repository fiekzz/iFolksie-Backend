import { Hono } from "hono";
import { jwt } from "hono/jwt";

const createStudentAPI = new Hono();

createStudentAPI.post(
    "/",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        return c.json({
            message: "Hello",
        });
    }
);

export default createStudentAPI;
