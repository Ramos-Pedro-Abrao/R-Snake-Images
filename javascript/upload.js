const container = document.getElementById("container");
const inputFile = document.getElementById("input-file");
const uploadDialog = document.getElementById("upload-dialog");
const openUploadLink = document.getElementById("open-upload");
const closeUploadButton = uploadDialog?.querySelector(".close-dialog");
const chooseImagesButton = document.getElementById("choose-images");
const cancelUploadButton = document.getElementById("cancelar_btn");
const confirmUploadButton = document.getElementById("carregar");
const selectionStatus = document.getElementById("upload-selection");

// Arquivos escolhidos ficam pendentes; só são publicados quando o usuário confirma.
let selectedFiles = [];

function clearSelection() {
    // Limpa tanto o estado em memória quanto o input para permitir escolher os mesmos arquivos novamente.
    selectedFiles = [];
    if (inputFile) inputFile.value = "";
    if (selectionStatus) selectionStatus.textContent = "Nenhuma imagem selecionada";
}

function cancelUpload() {
    // Todo caminho de cancelamento usa esta função para descartar a seleção e fechar o diálogo.
    clearSelection();
    uploadDialog?.close();
}

function createImageCard(image) {
    const element = document.createElement("div");
    const imageElement = document.createElement("img");

    element.className = "element";
    imageElement.src = `/api/images/${image.id}/content`;
    imageElement.alt = image.name;
    element.append(imageElement);

    return element;
}

async function loadImages() {
    const response = await fetch("/api/images");

    if (!response.ok) {
        throw new Error("Não foi possível carregar as imagens salvas.");
    }

    const images = await response.json();
    container?.prepend(...images.map(createImageCard));
}

loadImages().catch((error) => {
    console.error(error);
});

openUploadLink?.addEventListener("click", (event) => {
    event.preventDefault();
    // Abre o diálogo sem navegar para a âncora do link.
    uploadDialog?.showModal();
});

// O botão visível aciona o seletor de arquivos, que permanece oculto na página.
chooseImagesButton?.addEventListener("click", () => inputFile?.click());

// Fechar pelo botão ou por Cancelar tem o mesmo efeito: nada é publicado.
closeUploadButton?.addEventListener("click", cancelUpload);
cancelUploadButton?.addEventListener("click", cancelUpload);

confirmUploadButton?.addEventListener("click", async () => {
    // Não fecha o diálogo se ainda não houver imagens válidas para confirmar.
    if (!selectedFiles.length) {
        if (selectionStatus) selectionStatus.textContent = "Escolha pelo menos uma imagem antes de confirmar";
        return;
    }

    confirmUploadButton.disabled = true;
    if (selectionStatus) selectionStatus.textContent = "Enviando imagens...";

    try {
        // A publicação só acontece aqui, depois do clique em OK.
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("images", file));

        const response = await fetch("/api/images", {
            method: "POST",
            body: formData
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Não foi possível salvar as imagens.");
        }

        // Atualiza o mural com as imagens que o servidor confirmou como salvas.
        const savedImages = result.images.map(createImageCard);
        container?.prepend(...savedImages);
        clearSelection();
        uploadDialog?.close();
    } catch (error) {
        if (selectionStatus) selectionStatus.textContent = error.message;
    } finally {
        confirmUploadButton.disabled = false;
    }
});

document.addEventListener("keydown", (event) => {
    // Escape cancela a operação inteira, inclusive os arquivos ainda não confirmados.
    if (event.key === "Escape" && uploadDialog?.open) {
        event.preventDefault();
        cancelUpload();
    }
});

uploadDialog?.addEventListener("click", (event) => {
    // Cliques no fundo do diálogo cancelam; cliques no conteúdo interno não.
    if (event.target === uploadDialog) {
        cancelUpload();
    }
});

inputFile?.addEventListener("change", () => {
    // Selecionar arquivos apenas atualiza a lista pendente; não cria imagens no mural.
    selectedFiles = Array.from(inputFile.files || []).filter((file) => file.type.startsWith("image/"));

    // Informa quantas imagens válidas estão aguardando a confirmação.
    if (selectionStatus) {
        selectionStatus.textContent = selectedFiles.length
            ? `${selectedFiles.length} imagem(ns) selecionada(s)`
            : "Nenhuma imagem válida selecionada";
    }
});
