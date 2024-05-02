import { Hono } from "hono"
import { jwt } from "hono/jwt"

const getStudentDiaries = new Hono()

getStudentDiaries.get('/', jwt({
    secret: process.env.JWT_SECRET!
}), async (c) => {

    const payload = c.get('jwtPayload')

    return c.json({
        message: `Diaries for ${payload.email}`,
        data: {
            diaries: [],
        },
        success: true,
    })

})

export default getStudentDiaries