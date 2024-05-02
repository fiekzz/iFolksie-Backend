import https from "https";
import http from "http";
import {
    PutObjectCommand,
    S3Client,
    DeleteObjectsCommand,
    type DeleteObjectsCommandOutput,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import type { IS3UploadResponse } from "../controllers/dailylogs/types/DOUploadResponse";
import { settings } from "../constants/global-settings";

interface IS3Upload {
    fileName: string;
    file: Buffer | Uint8Array;
    publicACL?: boolean;
    contentType?: string;
}

interface ICompressAndUploadToS3 {
    file: Blob;
    fileName: string;
    uid: string;
    filePath: string;
}

export class AGUploader {
    client: S3Client;

    constructor() {
        this.client = new S3Client({
            region: "ap-southeast-1",
            credentials: {
                accessKeyId: process.env.DO_SPACES_ACCESS_KEY!,
                secretAccessKey: process.env.DO_SPACES_SECRET_KEY!,
            },
            endpoint: "https://sgp1.digitaloceanspaces.com",
            forcePathStyle: false,
        });
    }

    deleteObjectFromS3 = ({ keys }: { keys: string[] }) => {
        return new Promise<DeleteObjectsCommandOutput>(
            async (resolve, reject) => {
                const command = new DeleteObjectsCommand({
                    Bucket: "ag4u-staging",
                    Delete: {
                        Objects: keys.map((item) => ({
                            Key: item,
                        })),
                    },
                });

                try {
                    const response = await this.client.send(command);
                    resolve(response);
                } catch (err) {
                    console.error(err);
                    reject(err);
                }
            }
        );
    };

    getPresignedURL = (mediaKey: string) => {
        const command = new GetObjectCommand({
            Bucket: settings.mediaBucketName,
            Key: mediaKey,
        });
        return getSignedUrl(this.client, command, { expiresIn: 3600 });
    };

    uploadToS3 = ({ fileName, file, publicACL = false, contentType = "image/webp" }: IS3Upload) => {
        return new Promise<IS3UploadResponse>(async (resolve, reject) => {
            try {
                const command = new PutObjectCommand({
                    Bucket: settings.mediaBucketName,
                    Key: fileName,
                    Body: file,
                    ContentType: contentType,
                    ACL: publicACL ? "public-read" : "private",
                });

                const result = await this.client.send(command);

                resolve(result as IS3UploadResponse);
            } catch (error) {
                console.log(error);
                reject(error);
            }

            // try {
            //     const parallelUploadS3 = new Upload({
            //         client: this.client,
            //         params: {
            //             Bucket: "ag4u-staging",
            //             Key: fileName,
            //             Body: file,
            //             ContentType: "image/webp",
            //         },
            //     });

            //     parallelUploadS3.on("httpUploadProgress", (progress) => {
            //         console.log(progress);
            //     });

            //     const result = await parallelUploadS3.done();

            //     // console.log(result);

            //     resolve(result as IS3UploadResponse);
            // } catch (error) {
            //     console.log(error);
            //     reject(error);
            // }
        });
    };

    compressAndUploadToS3 = async ({
        file,
        fileName,
        uid,
        filePath,
    }: ICompressAndUploadToS3) => {
        const workerURL = new URL("AGImageWorker.ts", import.meta.url).href;

        const worker = new Worker(workerURL);

        const arr = new Uint8Array(await file.arrayBuffer());

        worker.postMessage({
            fileName,
            file: arr,
            uid,
            filePath,
        });
    };

    createPresignedUrlWithClient = ({
        bucket,
        key,
    }: {
        bucket: string;
        key: string;
    }) => {
        const client = new S3Client({
            region: "ap-southeast-1",
            credentials: {
                accessKeyId: process.env.DO_SPACES_ACCESS_KEY!,
                secretAccessKey: process.env.DO_SPACES_SECRET_KEY!,
            },
            endpoint: "https://sgp1.digitaloceanspaces.com",
            forcePathStyle: false,
        });
        const command = new PutObjectCommand({ Bucket: bucket, Key: key });
        return getSignedUrl(client, command, { expiresIn: 3600 });
    };
}

export function httpRequestPut(url: string, data: any) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            url,
            {
                method: "PUT",
                headers: { "Content-Length": new Blob([data]).size },
            },
            (res) => {
                let responseBody = "";
                res.on("data", (chunk) => {
                    responseBody += chunk;
                });
                res.on("end", () => {
                    resolve(responseBody);
                });
            }
        );
        req.on("error", (err) => {
            reject(err);
        });
        req.write(data);
        req.end();
    });
}

// export const main = async () => {
//     const REGION = "ap-southeast-1";
//     const BUCKET = "ag4u-staging";
//     const KEY = "example_file.txt";

//     // There are two ways to generate a presigned URL.
//     // 1. Use createPresignedUrl without the S3 client.
//     // 2. Use getSignedUrl in conjunction with the S3 client and GetObjectCommand.
//     try {
//         const clientUrl = await new AGUploader().createPresignedUrlWithClient({
//             bucket: BUCKET,
//             key: "elyas-izzah.txt",
//         });

//         console.log("Calling PUT using presigned URL with client");
//         await httpRequestPut(
//             "http://localhost:3000/v2/dailylogs/upload",
//             "Elyas"
//         );

//         console.log("\nDone. Check your S3 console.");
//     } catch (err) {
//         console.error(err);
//     }
// };
