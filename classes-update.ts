import fs from 'fs/promises'
import { prisma } from './lib/app/prisma';

const data = await fs.readFile('ag-classes.json', 'utf-8')

// Toddler = 78869fa6-dada-48d4-a1e6-337a4f1e4d29
// Pre Toddler = 8f86e160-5a5b-4c56-b564-84e978f926b5
// Infant = b5add0c6-601d-428c-b68a-b21ed106934e


interface AGClasses {
    ClassID: string;
    ClassName: string;
    Subcategory?: any;
    fSubcategoryID?: string;
}

const classes = JSON.parse(data) as AGClasses[]

console.log('Before: ' + classes.length);

const newClasses: AGClasses[] = []

for (let i = 0; i < classes.length; i++) {
    const agClass = classes[i];
    
    if (agClass.ClassName.startsWith('Infant')) {
        newClasses.push({
            ...agClass,
            fSubcategoryID: 'b5add0c6-601d-428c-b68a-b21ed106934e'
        })
    } else if (agClass.ClassName.startsWith('Toddler')) {
        newClasses.push({
            ...agClass,
            fSubcategoryID: '78869fa6-dada-48d4-a1e6-337a4f1e4d29'
        })
    }
    else if (agClass.ClassName.startsWith('Pre Toddler')) {
        newClasses.push({
            ...agClass,
            fSubcategoryID: '8f86e160-5a5b-4c56-b564-84e978f926b5'
        })
        
    }
    else {
        newClasses.push({
            ...agClass,
            fSubcategoryID: '78869fa6-dada-48d4-a1e6-337a4f1e4d29'
        })

    }

}

const dataUpdate = await prisma.$transaction(
    newClasses.map((agClass) => {
        return prisma.aGClasses.update({
            where: {
                ClassID: agClass.ClassID
            },
            data: {
                Subcategory: {
                    connect: {
                        SubcategoryID: agClass.fSubcategoryID
                    }
                }
            }
        })
    })
)

console.log(dataUpdate);
