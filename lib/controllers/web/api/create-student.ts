import { Hono } from "hono";
import { prisma } from "../../../app/prisma";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { DateTime } from "luxon";

const createStudentWebAPI = new Hono();

createStudentWebAPI.use(cors());

const zCreateStudentAPI = z.object({
    fullName: z.string(),
    icno: z.string(),
    gender: z.enum(["Male", "Female"]),
    dob: z.string().refine((value) => DateTime.fromFormat(value, 'dd/MM/yyyy').isValid, {
        message: "Invalid date",
    }),
    citizenship: z.string(),
    immunization: z.string(),
    allergy: z.string(),
    pickupPerson: z.string(),
    emergencyContact: z.string(),
    parentIDs: z.array(z.string()),
    classID: z.string()
});

type ICreateStudentAPI = z.infer<typeof zCreateStudentAPI>;

createStudentWebAPI.post("/", zValidator("json", zCreateStudentAPI), async (c) => {
    const payload = await c.req.json<ICreateStudentAPI>();

    try {
        const data = await prisma.students.create({
            data: {
                EffectiveDate: new Date(),
                ExpiryDate: new Date(),
                Address: "",
                FullName: payload.fullName,
                StudentIC: payload.icno,
                StudentCategory: "",
                Gender: payload.gender,
                DOB: DateTime.fromFormat(payload.dob, 'dd/MM/yyyy').toJSDate(),
                Citizenship: payload.citizenship,
                Immunization: payload.immunization,
                Allergy: payload.allergy,
                PickupPerson: payload.pickupPerson,
                EmergencyContact: payload.emergencyContact,
                Status: "Registered",
                Parents: {
                    connect: payload.parentIDs.map((item) => ({
                        UserID: item
                    }))
                },
                AGClasses: {
                    connect: {
                        ClassID: payload.classID,
                    }
                },
            },
        });

        return c.json({
            data,
            message: "Successfully created student",
            success: true,
        }, 201);
    } catch (error) {
        console.log(error);

        return c.json(
            {
                data: {
                    error: (error as Error).message
                },
                message:
                    "Something went wrong. If problem persists, please contact support.",
                success: false,
            },
            500
        );
    }
});

export default createStudentWebAPI;
