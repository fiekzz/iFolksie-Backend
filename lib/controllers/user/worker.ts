// prevents TS errors
declare var self: Worker;

import sharp from "sharp";
import { AGUploader } from "../../services/AGUploader";
import { compressImage } from "../../services/AGImageCompress";
import { DateTime } from "luxon";
import { prisma } from "../../app/prisma";

self.onmessage = async (event: MessageEvent) => {
    try {

        const { fileName, file, uid } = event.data as {
            fileName: string;
            file: Uint8Array;
            uid: string;
        };

        const uploader = new AGUploader();

        console.log("Begin uploading preview procedure");

        console.log("Compressing image - START");

        const [imageBufPreview320, imageBufPreview640] = await Promise.all([
            compressImage({ buffer: file, width: 320, height: 320 }),
            compressImage({ buffer: file, width: 640, height: 640 }),
        ]);

        console.log("Compressing image - DONE");
        console.log("Uploading images - START");

        const [file1, file2] = await Promise.all([
            uploader.uploadToS3({
                file: Buffer.from(file),
                fileName: `profile-photos/${DateTime.now().toISO()}-${fileName}-ori.webp`,
            }),
            uploader.uploadToS3({
                file: imageBufPreview320,
                fileName: `profile-photos/${DateTime.now().toISO()}-${fileName}-320.webp`,
            }),
            uploader.uploadToS3({
                file: imageBufPreview640,
                fileName: `profile-photos/${DateTime.now().toISO()}-${fileName}-640.webp`,
            }),
        ]);

        console.log("Uploading images - DONE");
        console.log("Updating DB - START");

        await prisma.aGMedia.createMany({
            data: [
                {
                    MediaType: "image",
                    MediaURL: file1.Location,
                    MediaKey: file1.Key,
                    FUserID: uid,
                },
                {
                    MediaType: "image",
                    MediaURL: file2.Location,
                    MediaKey: file2.Key,
                    FUserID: uid,
                },
            ],
        });

        console.log("Updating DB - DONE");

        console.log("Done uploading preview");

        postMessage("world");
        process.exit();
    } catch (error) {

        console.log('ERROR IN WORKER');
        console.log(error);
        
    }
};
