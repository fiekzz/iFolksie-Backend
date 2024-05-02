import { z } from "zod";

const zLoginTypes = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

type ILoginTypes = z.infer<typeof zLoginTypes>;

export { zLoginTypes, type ILoginTypes }