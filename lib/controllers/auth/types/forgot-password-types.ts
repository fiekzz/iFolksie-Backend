import { z } from "zod";

const zForgotPasswordTypes = z.object({
    email: z.string().email(),
});

type IForgotPasswordTypes = z.infer<typeof zForgotPasswordTypes>;

export { zForgotPasswordTypes, type IForgotPasswordTypes }