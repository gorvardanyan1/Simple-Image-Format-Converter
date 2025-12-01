
import express from 'express'
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import archiver from 'archiver';
import fs from 'fs';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

app.use(express.static('public'))


app.get('/', (req, res) => {
    res.redirect("index.html")
})

app.post("/convert", upload.array("images", 30), async (req, res) => {

    try {
        const { format } = req.body;

        if (!format) {
            return res.status(400).json({ error: "Please specify png/jpg/webp/avif" });
        }

        if (!req.files) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        if (req.files.length && req.files.length === 1) {
            const inputPath = req.files[0].path;
            const buffer = await sharp(req.files[0].buffer)
                .toFormat(format)
                .toBuffer();
            res.set("Content-Type", `image/${format}`);
            const filename = `converted.${format}`;

            res.setHeader("Content-Type", `image/${format}`);
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.send(buffer);
        } else {
            res.setHeader("Content-Type", "application/zip");
            res.setHeader("Content-Disposition", `attachment; filename="converted.zip"`);

            const archive = archiver("zip");
            archive.pipe(res);

            for (const file of req.files) {
                 const buffer = await sharp(file.buffer)
                .toFormat(format)
                .toBuffer();

            archive.append(buffer, { name: `${file.originalname}.${format}` });
            }
            await archive.finalize();
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to convert image" });
    }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
