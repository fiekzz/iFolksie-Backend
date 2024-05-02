import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";

const getDiaryDates = new Hono();

const ALLOWED_ROLES = ["administrator", "branch manager", "staff"];

getDiaryDates.get(
    "/:studentID/:month/:year",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {
        const studentId = c.req.param("studentID");

        const month = Number(c.req.param("month"));

        const year = Number(c.req.param("year"));

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

        //   const startDate = new Date(2024, 2, 1); // March 1st, 2024 (year, month, day)
        //   const endDate = new Date(2024, 2, 31); // March 31st, 2024

        // const year_string = 2024;
        // const month_string = 2;

        // const year = Number(year_string);
        // const month = Number(month_string);

        try {
            // const startDate = new Date(year, month - 1, 1);
            // const endDate = new Date(year, month, 1 - 1);

            // "2022-01-15"

            const s_date = `${year}-0${month}-1`

            const e_date = `${year}-0${month + 1}-1`

            const dates = await prisma.dailyLogs.findMany({
                where: {
                    Students: {
                        some: {
                            StudentID: studentId,
                        },
                    },
                    TimePosted: {
                        gte: new Date(s_date).toISOString(),
                        lte: new Date(e_date).toISOString(),
                    },
                },
                select: {
                    TimePosted: true,
                },
            });

            var data: Date[] = []

            dates.length !== 0 ? dates.forEach((d) => {
                const date = d.TimePosted
                if (!data.some((d) => d.toDateString() === date!.toDateString())) {
                    data.push(date!)
                }
            }) : null;



            return c.json({
                message: `Dates fetch successfully`,
                success: true,
                data: data,
            });

        } catch (error) {

            console.log(error)

            return c.json({
                message: "Internal server error",
                success: false,
                data: {},
            }, 500)

        }
    }
);

export default getDiaryDates;
