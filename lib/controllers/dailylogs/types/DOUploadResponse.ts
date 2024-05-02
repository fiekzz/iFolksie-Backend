export interface IS3UploadResponse {
    $metadata: Metadata;
    ETag: string;
    Bucket: string;
    Key: string;
    Location: string;
}

export interface Metadata {
    httpStatusCode: number;
    requestId: string;
    attempts: number;
    totalRetryDelay: number;
}
