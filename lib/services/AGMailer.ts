import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { DateTime } from "luxon";

interface IMigrationEmail {
    fullName: string
    phone: string
    email: string
    verificationLink: string
    contactEmail: string
}

class AGMailer {

    private client: SESv2Client;

    constructor() {
        this.client = new SESv2Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
            region: 'ap-southeast-1'
        });
    }

    async sendForgotPasswordEmail(email: string) {

        

    }

    async sendMigrationEmail(data: IMigrationEmail) {

        console.log('Sending migration email to: ' + data.email);

        const command = new SendEmailCommand({
            Content: {
                Template: {
                    TemplateName: 'AG4UMigrationEmailTemplate',
                    TemplateData: JSON.stringify({
                        fullName: data.fullName,
                        phone: data.phone,
                        email: data.email,
                        verificationLink: data.verificationLink,
                        contactEmail: data.contactEmail,
                        date: DateTime.now().toFormat('dd-MMM-yyyy hh:mm a'),
                    })
                }
            },
            FromEmailAddress: (`AltiGenius4U <no-reply@ag4u.com.my>`),
            Destination: {
                ToAddresses: [
                    data.email
                ]
            }
        });

        const response = await this.client.send(command);

        console.log(response);

    }

    async sendConfirmationEmail(email: string) {

        console.log('Sending registration email to: ' + email);

        const command = new SendEmailCommand({
            Content: {
                Template: {
                    TemplateName: 'AG4UConfirmationEmail',
                    TemplateData: JSON.stringify({
                        date: DateTime.now().toFormat('dd-MMM-yyyy hh:mm a'),
                        name: "Elyas Asmad",
                        email: 'elyasasmadz@gmail.com',
                        phone: '+601137737496',
                        verificationLink: 'https://ag4u.com.my/verify/1234567890',
                        contactEmail: 'elyasasmadz@gmail.com'
                    })
                }
            },
            FromEmailAddress: (`AltiGenius4U <no-reply@ag4u.com.my>`),
            Destination: {
                ToAddresses: [
                    email
                ]
            }
        });

        const response = await this.client.send(command);

        console.log(response);

    }
    
}

export { AGMailer }