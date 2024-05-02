// prevents TS errors
declare var self: Worker;

import sharp from "sharp";
import { AGUploader } from "../../services/AGUploader";

self.onmessage = (event: MessageEvent) => {

    // diaries/[uid]/[ISO Date]/[studentname]-by-[teachersname]-timestamp.webp

    // const promises = providedImages.map((item, index) => {

    const { fileName, file } = event.data

    const uploader = new AGUploader();

    console.log('Uploading preview');

    sharp(file, { failOn: 'truncated' })
        .webp({ quality: 80 })
        .resize(320, 320, { fit: 'inside' })
        .toBuffer()
        .then((imageBufPreview) => {
            uploader.uploadToS3({
                file: imageBufPreview,
                fileName: `${fileName}.webp`,
            });
        
            console.log('Done uploading preview');
            
            postMessage("world");
            self.terminate()
        })

};