export interface ITekkisPaymentResponse {
    msg: string;
    response: Response;
}

export interface Response {
    paymentDetails: PaymentDetails;
}

export interface PaymentDetails {
    payment_key_id: string;
    payment_name: string;
    payment_ref_no: string;
    payment_invoice_no: string;
    payment_email: string;
    payment_phone_number: any;
    payment_phone_country_code: any;
    payment_desc: string;
    payment_option: string;
    payment_type_allow: string;
    payment_unique_key: string;
    payment_amount: string;
    payment_status: string;
    payment_created_datetime: string;
    payment_callback_url: string;
    payment_redirect_url: string;
    payment_link: string;
    payment_custom_fields: PaymentCustomField[];
}

export interface PaymentCustomField {
    title: string;
    value: string;
}
