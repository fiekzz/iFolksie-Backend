import { getMessaging } from 'firebase-admin/messaging'
import fadminApp from './FirebaseAdmin';

interface IChatParticipants {
    fcmToken: string;
    imageUrl?: string;
}

interface IMessagePayload {
    message: string,
    event: any,
    medias: string;
    senderName: string;
}

class FCMService {

    private static messaging = getMessaging(fadminApp);

    static async singleSend(token: string, payload: any) {
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEV] Blocked notification request for debugging purposes.');
            return;
        };
        
        try {
            const response = await this.messaging.send({
                token,
                data: payload
            });
            console.log('Successfully sent message:', response);
        } catch (error) {
            console.log('Error sending message:', error);
        }

    }

    static async sendNotification(token: string, payload: { title: string, message: string }) {

        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEV] Blocked notification request for debugging purposes.');
            return;
        };
        
        try {
            const response = await this.messaging.send({
                token,
                notification: {
                    title: payload.title,
                    body: payload.message,
                }
            });
            console.log('Successfully sent message:', response);
        } catch (error) {
            console.log('Error sending message:', error);
        }

    }

    static async broadcastNotification(tokens: string[], payload: { title: string, message: string }) {
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEV] Blocked notification request for debugging purposes.');
            return;
        };

        try {
            const response = await this.messaging.sendEach(
                tokens.map((tok) => {
                    return {
                        token: tok,
                        // data: payload as any,
                        notification: {
                            title: payload.title,
                            body: payload.message,
                        },
                    }
                })
            );

            console.log(response);

            console.log('Success');
            
        } catch (error) {
            console.log(error);
            console.log('Error sending notification');
            
        }
    }

    static async multiSend(participants: IChatParticipants[], payload: IMessagePayload) {
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEV] Blocked notification request for debugging purposes.');
            return;
        };

        try {

            console.log(participants.map((singleParticipant) => {
                return {
                    token: singleParticipant.fcmToken,
                    data: payload,
                    notification: {
                        title: `(MESSAGE) From ${payload.senderName}`,
                        body: payload.message,
                        imageUrl: singleParticipant.imageUrl,
                    }
                }
            }));
            

            const response = await this.messaging.sendEach(
                participants.map((singleParticipant) => {
                    return {
                        token: singleParticipant.fcmToken,
                        // data: payload as any,
                        notification: {
                            title: payload.senderName,
                            body: payload.message,
                            imageUrl: singleParticipant.imageUrl,
                        },
                        apns: {
                            payload: {
                                aps: {
                                    sound: {
                                        critical: true,
                                        name: 'Note.aiff'
                                    },
                                },
                            },
                            fcmOptions: {
                                imageUrl: singleParticipant.imageUrl,
                            }
                        }
                    }
                })
            );
            console.log('Successfully sent message:', response);
        } catch (error) {
            console.log('Error sending message:', error);
        }

    }

}

export default FCMService;
