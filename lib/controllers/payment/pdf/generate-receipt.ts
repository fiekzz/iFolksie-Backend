import fs from "fs";
import PDFDocument from "pdfkit";
import { Hono } from "hono";

const generateReceipt = new Hono();

generateReceipt.post("/", async (c) => {
    try {
        const doc = new PDFDocument();

        doc.pipe(fs.createWriteStream("receipt.pdf"));

        doc.font("Times-Roman").fontSize(24).text("Receipt", 100, 100);

        doc.end();

        // stream.on("finish", function () {
        //     // get a blob you can do whatever you like with
        //     const blob = stream.toBlob("application/pdf");

        //     // or get a blob URL for display in the browser
        //     const url = stream.toBlobURL("application/pdf");
        //     iframe.src = url;
        // });

        // var stream = doc.pipe(blobStream());
        

        return ;
    } catch (err) {
        return c.json({
            message: "Error",
            data: {err},
            success: false,
        }, 400);
    }
});

export default generateReceipt;

// const doc = new PDFDocument()

// const generateReceipt = () => {

//     doc.pipe(fs.createWriteStream('receipt.pdf'))

//     doc.font('Times-Roman').fontSize(24).text('Receipt', 100, 100)

//     doc.end()
// }

// export default generateReceipt
