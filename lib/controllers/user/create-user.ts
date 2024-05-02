import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { prisma } from "../../app/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { cors } from "hono/cors"

const createUser = new Hono();

createUser.use(cors())

const GENDERS = ["Male", "Female"];

const zCreateUser = z.object({
    fullName: z.string(),
    phoneNumber: z.string(),
    email: z.string(),
    icNumber: z.string(),
    dob: z.string(),
    gender: z.string().refine((value) => GENDERS.includes(value), {
        message: 'Gender must be either "Male" or "Female" only.',
    }),
    address: z.string(),
    city: z.string(),
    postcode: z.string(),
    state: z.string(),
    isTeacher: z.string(),
    branchID: z.string(),
});

createUser.post("/", zValidator("form", zCreateUser), async (c) => {
    try {
        const body = await c.req.parseBody<z.infer<typeof zCreateUser>>();

        const testBranch = await prisma.branch.findFirst({
            where: {
                BranchID: body.branchID
            },
            select: {
                AGClasses: {
                    select: {
                        ClassID: true
                    }
                }
            }
        })

        const userExists = await prisma.users.findFirst({
            where: {
                OR: [
                    {
                        MobileNumber: body.phoneNumber
                    },
                    {
                        EmailAddress: body.email
                    },
                    {
                        ICNo: body.icNumber
                    }
                ]
            },
        })

        if (userExists) {
            return c.json({
                message: "User already exists",
                success: false,
                data: {},
            }, 409);
        }
        
	    console.log(body)

        const user = await prisma.users.create({
            data: {
                UserID: nanoid(),
                FullName: body.fullName,
                MobileNumber: body.phoneNumber,
                EmailAddress: body.email,
                ICNo: body.icNumber,
                Gender: body.gender,
                DOB: new Date(body.dob),
                Address1: body.address,
                City: body.city,
                ZipCode: body.postcode,
                State: body.state,
                Status: "",
                VehicleInfo: "",
                Role: {
                    connect: {
                        // Check if the user is a teacher or not (if teacher, assign teacher roleId, else assign parent roleId)
                        RoleID: body.isTeacher === "true" ? "hACnSjt8mz-lF1yq-g5ek" : 'zBKmZFBq6WwR0P7f7ebee',
                    }
                },
                AGClasses: {
                    connect: testBranch?.AGClasses.map((c) => {
                        return {
                            ClassID: c.ClassID
                        }
                    }) 
                }
            },
        });

        return c.json({
            message: "User created successfully",
            success: true,
            data: {},
        })

    } catch (error) {

        console.error(error);

        return c.json({
            message: "An error occurred while creating the user",
            success: false,
            data: error,
        });
    }
});

export default createUser;
