import { AGMailer } from "./lib/services/AGMailer";

const mailer = new AGMailer();

await mailer.sendConfirmationEmail('elyasasmadz@gmail.com')