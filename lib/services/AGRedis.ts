import { RedisClientType, createClient } from "redis";
import { settings } from "../constants/global-settings";

class AGRedis {
    
    // client: RedisClientType;

    // constructor() {
    //     this.client = createClient({
    //         url: 'redis://localhost:6379',
    //     });

    //     this.client.on("error", (err) => console.log("Redis Client Error", err));

    //     this.connect()
    // }

    // private async connect() {
    //     await this.client.connect()
    // }

    // public async set(key: string, value: string) {
    //     await this.client.set(key, value)
    // }

    // public async get(key: string) {
    //     return await this.client.get(key)
    // }


}

export default AGRedis;
