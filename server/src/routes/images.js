import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import pool from "../db.js";

const router = Router();
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
    fileFilter: (request, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            const error = new Error("Formato não permitido. Use JPEG, PNG ou WebP.");
            error.status = 400;
            callback(error);
            return;
        }

        callback(null, true);
    }
});

router.get("/", async (request, response, next) => {
    try {
        const [images] = await pool.execute(
            "SELECT id, name, tipo FROM images ORDER BY id DESC"
        );

        response.json(images);
    } catch (error) {
        next(error);
    }
});

router.get("/:id/content", async (request, response, next) => {
    const id = Number(request.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
        response.status(400).json({ error: "Identificador de imagem inválido." });
        return;
    }

    try {
        const [rows] = await pool.execute(
            "SELECT tipo, dados FROM images WHERE id = ? LIMIT 1",
            [id]
        );

        if (!rows.length) {
            response.status(404).json({ error: "Imagem não encontrada." });
            return;
        }

        response
            .set("Content-Type", rows[0].tipo)
            .set("X-Content-Type-Options", "nosniff")
            .set("Cache-Control", "public, max-age=3600")
            .send(rows[0].dados);
    } catch (error) {
        next(error);
    }
});

router.post("/", upload.array("images", 10), async (request, response, next) => {
    const files = request.files || [];

    if (!files.length) {
        response.status(400).json({ error: "Selecione pelo menos uma imagem." });
        return;
    }

    try {
        const validatedFiles = await Promise.all(files.map(async (file) => {
            const detectedType = await fileTypeFromBuffer(file.buffer);

            if (!detectedType || !allowedTypes.has(detectedType.mime)) {
                const error = new Error(`O arquivo ${file.originalname} não é uma imagem JPEG, PNG ou WebP válida.`);
                error.status = 400;
                throw error;
            }

            return {
                name: file.originalname.slice(0, 255),
                tipo: detectedType.mime,
                dados: file.buffer
            };
        }));

        const connection = await pool.getConnection();
        const images = [];

        try {
            await connection.beginTransaction();

            for (const file of validatedFiles) {
                const [result] = await connection.execute(
                    "INSERT INTO images (name, tipo, dados) VALUES (?, ?, ?)",
                    [file.name, file.tipo, file.dados]
                );

                images.push({ id: result.insertId, name: file.name, tipo: file.tipo });
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        response.status(201).json({ images });
    } catch (error) {
        next(error);
    }
});

export default router;