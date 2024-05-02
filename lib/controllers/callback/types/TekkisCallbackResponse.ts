
type PaymentStatus = 'pending' | 'completed' | 'rejected'

export interface ITekkisCBResponse {
    payment_name: string;
    payment_email: string;
    payment_phone_number: string;
    payment_desc: string;
    payment_type: string;
    payment_method: string;
    payment_unique_key: string;
    payment_ref_no: string;
    payment_invoice_no: string;
    payment_amount: string;
    payment_status: PaymentStatus;
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
