import { createClient } from "redis";
import { RedisClientType } from "redis";
import { settings } from "../constants/global-settings";

class AGSingleton {

    static instance: AGSingleton;

    private client: RedisClientType;

    static getInstance() {
        if (!AGSingleton.instance) {
            AGSingleton.instance = new AGSingleton();
        }

        return AGSingleton.instance;
    }

    private constructor() {
        console.log('Singleton instance created');

        this.client = createClient({
            url: settings.redisUrl,
            password: process.env.REDIS_PASSWORD,
        })

        this.client.on('error', (err) => console.log('Redis Client Error', err));

        this.connect();
    }

    private async connect() {
        await this.client.connect();
    }

    async getRedis() {
        return this.client;
    }
}

export default AGSingleton;