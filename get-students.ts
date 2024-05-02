import { prisma } from "./lib/app/prisma";

const data = await prisma.users.findFirst({
    
})