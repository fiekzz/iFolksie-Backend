import { Hono } from "hono";
import { jwt } from "hono/jwt";

const diaryListAPI = new Hono()

diaryListAPI.get('/', jwt({
    secret: process.env.JWT_SECRET!
}), async (c) => {

    return c.json({
        message: 'Hello'
    })

});

export default diaryListAPI