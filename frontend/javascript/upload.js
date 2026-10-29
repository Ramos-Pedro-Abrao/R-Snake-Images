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

confirmUploadButton?.addEventListener("click", () => {
    // Não fecha o diálogo se ainda não houver imagens válidas para confirmar.
    if (!selectedFiles.length) {
        if (selectionStatus) selectionStatus.textContent = "Escolha pelo menos uma imagem antes de confirmar";
        return;
    }

    // A publicação só acontece aqui, depois do clique em OK.
    selectedFiles.forEach((file) => {
        const image = document.createElement("img");
        const imageUrl = URL.createObjectURL(file);

        image.src = imageUrl;
        image.alt = file.name;
        // Libera a URL temporária assim que o navegador terminar de carregar (ou falhar ao carregar) a imagem.
        image.addEventListener("load", () => URL.revokeObjectURL(imageUrl), { once: true });
        image.addEventListener("error", () => URL.revokeObjectURL(imageUrl), { once: true });

        // Cada arquivo vira um item no início do mural.
        const card = document.createElement("div");
        card.className = "element";
        card.append(image);
        container?.prepend(card);
    });

    // Após publicar, prepara o diálogo para uma nova seleção.
    clearSelection();
    uploadDialog?.close();
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
