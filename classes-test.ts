import { prisma } from "./lib/app/prisma";
import fs from 'fs/promises'

const classes = await prisma.aGClasses.findMany({
    select: {
        ClassID: true,
        ClassName: true,
        Subcategory: true
    },
    where: {
        Subcategory: {
            is: null
        }
    }
})

await fs.writeFile('ag-classes.json', JSON.stringify(classes, null, 2), 'utf-8')