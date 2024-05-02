import { Database, getDatabase, ServerValue } from "firebase-admin/database";
import firebaseApp from "./FirebaseAdmin";
import { DateTime } from "luxon";

class RTDBService {
    private static db: Database = getDatabase(firebaseApp);

    public static async setReadStatus(
        messageSenderUID: string,
        receiverUID: string,
        conversationID: string,
    ) {

        await Promise.all([
            this.db.ref(`metadata/${messageSenderUID}/lastMessages/${conversationID}/isMessageRead`).set(true),
            this.db.ref(`metadata/${receiverUID}/lastMessages/${conversationID}/unreadCount`).set(0)
        ])

    }

    public static async setLastMessage(
        userID: string | string[],
        conversationID: string,
        message: string,
        senderID: string,
        senderName: string
    ) {

        if (Array.isArray(userID)) {

            const promises = []

            for (const id of userID) {
                promises.push(this.db.ref(`metadata/${id}/lastMessages`).update({
                    [conversationID]: {
                        message,
                        timestamp: DateTime.now().toISO(),
                        senderID,
                        senderName,
                        isMessageRead: false,
                        unreadCount: senderID === id ? 0 : ServerValue.increment(1)
                    },
                }));
            }

            await Promise.all(promises);

            return;
        }

        await this.db.ref(`metadata/${userID}/lastMessages`).update({
            [conversationID]: message,
        });
    }

    static async sendRTMessage(key: string, message: string, uid: string, conversationID: string, medias?: string[], metadata?: string) {
        
        const payload: { [k: string]: any } = {
            key,
            message: message,
            uid,
        }

        if (metadata) {
            payload['metadata'] = metadata
        }

        if (medias) {
            payload['medias'] = medias
        }
        
        await this.db.ref(`conversations/${conversationID}/realtime`).update(payload)
    }

}

export default RTDBService;
