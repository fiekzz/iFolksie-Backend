import axios from "axios";

class AGLogger {

    static async log(title: string, message: string, groupChatID: string = '-4137103352', parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown') {
        
        try {
            
            const response = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: groupChatID,
                text: `*[${title}]* ${message}`,
                parse_mode: parse_mode ?? 'Markdown'
            })

            return response.data

        } catch (error) {

            console.log(error)

            return error

        }

    }

}

export default AGLogger