interface IGenerateAGResponseProps {
    isSuccess?: boolean;
    data?: Record<string, any>;
    message?: string;
}

class AGServerResponse {

    static generate = ({ isSuccess, data, message }: IGenerateAGResponseProps) => {

        return {
            success: isSuccess ?? false,
            data: data ?? {},
            message: message ?? 'Not implemented',
        }
    
    }

    static InternalServerError = this.generate({
        isSuccess: false,
        message: 'Uh oh :/ Something went wrong on our side. Please try again.'
    })

}

export default AGServerResponse