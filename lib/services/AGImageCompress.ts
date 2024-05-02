import sharp from "sharp"

interface ICompressImage {
    buffer: Uint8Array;
    quality?: number;
    width?: number;
    height?: number;
}

const compressImage = ({ buffer, quality, width, height }: ICompressImage) => {
    return sharp(buffer, { failOn: 'truncated' })
            .webp({ quality: quality || 100})
            .resize(width, height, { fit: "inside" })
            .toBuffer();
}

const convertWebp = ({ buffer, quality, width, height }: ICompressImage) => {
    return sharp(buffer, { failOn: 'truncated' })
            .webp({ quality: quality || 100 })
            .toBuffer();
}

export { compressImage, convertWebp }