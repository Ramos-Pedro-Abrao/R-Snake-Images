import "dotenv/config";
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import imagesRouter from "./routes/images.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const frontendRoot = join(projectRoot, "frontend");

app.get("/", (request, response) => {
    response.sendFile(join(frontendRoot, "index.html"));
});

app.use("/styles", express.static(join(frontendRoot, "styles")));
app.use("/javascript", express.static(join(projectRoot, "javascript")));
app.use("/images", express.static(join(frontendRoot, "images")));
app.use("/api/images", imagesRouter);

app.use((error, request, response, next) => {
    if (response.headersSent) {
        next(error);
        return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
        response.status(413).json({ error: "Cada imagem pode ter no máximo 10 MB." });
        return;
    }

    if (error.code === "LIMIT_FILE_COUNT") {
        response.status(413).json({ error: "Envie no máximo 10 imagens por vez." });
        return;
    }

    const status = error.status || (error.name === "MulterError" ? 400 : 500);
    if (status >= 500) {
        console.error(error);
        response.status(500).json({ error: "Erro interno ao processar a solicitação." });
        return;
    }

    response.status(status).json({ error: error.message || "Não foi possível processar a solicitação." });
});

app.listen(port, () => {
    console.log(`Servidor disponível em http://localhost:${port}`);
});