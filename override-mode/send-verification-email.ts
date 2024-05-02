import { prisma } from "../lib/app/prisma";
import { settings } from "../lib/constants/global-settings";
import { AGMailer } from "../lib/services/AGMailer";
import { sign } from 'hono/jwt'

const mailer = new AGMailer();

const USER_EMAILS: string[] = [
    'nsyafiqah.bakri@gmail.com',
    'nurnabila.hamzah@yahoo.com',
    'afqzainol@gmail.com',
    'amiraazwani05@gmail.com'
]

const promises = USER_EMAILS.map((item) => prisma.users.findFirst({
    where: {
        EmailAddress: item
    }
}))

const returnedData = await prisma.$transaction(promises)

for await (const [index, user] of returnedData.entries()) {

    if (!user) {
        console.error(`${USER_EMAILS[index]} is not registered in the database.`);
        continue
    }

    const migrationToken = await sign(
        {
            sub: user.UserID,
            email: user.EmailAddress,
            role: "migrate-user",
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        process.env.EMAIL_REGISTRATION_SECRET!
    );
    
    await mailer.sendMigrationEmail({
        fullName: user.FullName,
        phone: user.MobileNumber,
        email: user.EmailAddress,
        verificationLink:
            settings.websiteUrl + "/auth/migrate-user?token=" + migrationToken,
        contactEmail: settings.contactEmail,
    });

    console.log(`Email has been sent successfully: ${user.EmailAddress}`);

}
