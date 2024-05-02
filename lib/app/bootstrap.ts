import { Hono } from "hono";
import { logger } from "hono/logger";

export function bootstrap() {
    const app = new Hono();

    // Hono Logger (Only for development mode)
    if (process.env.NODE_ENV !== "production") {

        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.error("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.");
            process.exit(1);
        }

        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.error("TELEGRAM_BOT_TOKEN environment variable is not set.");
            process.exit(1);
        }

        console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
        console.log("⚠️ Server is currently running on DEVELOPMENT mode.");
    }

    app.use("*", logger());

    return app
}
