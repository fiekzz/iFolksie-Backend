// prevents TS errors
declare var self: Worker;

import sharp from "sharp";
import { DateTime } from "luxon";
import { AGUploader } from "./AGUploader";
import { compressImage, convertWebp } from "./AGImageCompress";
import { prisma } from "../app/prisma";

self.onmessage = async (event: MessageEvent) => {
    try {

        const { fileName, file, uid, filePath } = event.data as {
            fileName: string;
            file: Uint8Array;
            uid: string;
            filePath: string;
        };

        const uploader = new AGUploader();

        console.log("Begin uploading preview procedure");

        console.log("Compressing image - START");

        const [imageBufOriginal, imageBufPreview320, imageBufPreview640] = await Promise.all([
            convertWebp({ buffer: file }),
            compressImage({ buffer: file, width: 320, height: 320 }),
            compressImage({ buffer: file, width: 640, height: 640 }),
        ]);

        console.log("Compressing image - DONE");
        console.log("Uploading images - START");

        const [fileOri, file320, file640] = await Promise.all([
            uploader.uploadToS3({
                file: imageBufOriginal,
                fileName: `${filePath}/${DateTime.now().toISO()}-${fileName}-ori.webp`,
            }),
            uploader.uploadToS3({
                file: imageBufPreview320,
                fileName: `${filePath}/${DateTime.now().toISO()}-${fileName}-320.webp`,
            }),
            uploader.uploadToS3({
                file: imageBufPreview640,
                fileName: `${filePath}/${DateTime.now().toISO()}-${fileName}-640.webp`,
            }),
        ]);

        console.log("Uploading images - DONE");
        console.log("Updating DB - START");

        await prisma.aGMedia.createMany({
            data: [
                {
                    MediaType: "image",
                    MediaURL: fileOri.Location,
                    MediaKey: fileOri.Key,
                    FUserID: uid,
                },
                {
                    MediaType: "image",
                    MediaURL: file320.Location,
                    MediaKey: file320.Key,
                    FUserID: uid,
                },
                {
                    MediaType: "image",
                    MediaURL: file640.Location,
                    MediaKey: file640.Key,
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
