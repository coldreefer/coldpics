/* ============================================================
   ColdPics - File System + UI Material Files
   Autor: ChatGPT (para Felipe Pardo)
   Versión: 1.0
============================================================ */

let rootHandle = null;
let currentFolderHandle = null;
let currentFolderName = "";

/* DOM */
const rootPrompt = document.getElementById("rootPrompt");
const initRootBtn = document.getElementById("initRootBtn");

const folderSection = document.getElementById("folderSection");
const folderList = document.getElementById("folderList");

const photosSection = document.getElementById("photosSection");
const photosGrid = document.getElementById("photosGrid");
const currentFolderNameEl = document.getElementById("currentFolderName");

const fabAddFolder = document.getElementById("fabAddFolder");
const fabTakePhoto = document.getElementById("fabTakePhoto");

const backFolders = document.getElementById("backFolders");


/* ============================================================
   INICIO
============================================================ */
window.addEventListener("DOMContentLoaded", async () => {
    const savedRoot = await getSavedRoot();

    if (!savedRoot) {
        showRootPrompt();
        return;
    }

    rootHandle = savedRoot;

    const ok = await verifyPermission(rootHandle);
    if (!ok) {
        showRootPrompt();
        return;
    }

    loadFolders();
});


/* ============================================================
   CREAR CARPETA RAÍZ
============================================================ */
initRootBtn.addEventListener("click", async () => {
    try {
        rootHandle = await window.showDirectoryPicker({
            id: "coldpics-root",
            mode: "readwrite"
        });

        // Crea ColdPics dentro de Pictures si no existe
        rootHandle = await rootHandle.getDirectoryHandle("ColdPics", { create: true });

        await saveRoot(rootHandle);
        showFolderList();
        loadFolders();

    } catch (e) {
        console.log("User canceled:", e);
    }
});


/* ============================================================
   GUARDAR / CARGAR ROOT HANDLE
============================================================ */
async function saveRoot(handle) {
    const granted = await verifyPermission(handle);
    if (!granted) return;

    const stored = await navigator.storage.persist();
    console.log("Persisted storage:", stored);

    localStorage.setItem("coldpics-root", await handleToKey(handle));
}

async function getSavedRoot() {
    const key = localStorage.getItem("coldpics-root");
    if (!key) return null;

    try {
        return await keyToHandle(key);
    } catch {
        return null;
    }
}


/* ============================================================
   PERMISOS
============================================================ */
async function verifyPermission(handle) {
    if (!handle) return false;

    const opts = { mode: "readwrite" };

    if (await handle.queryPermission(opts) === "granted") {
        return true;
    }
    if (await handle.requestPermission(opts) === "granted") {
        return true;
    }
    return false;
}


/* ============================================================
   UI — MOSTRAR: ROOT PROMPT / LISTA / FOTOS
============================================================ */
function showRootPrompt() {
    rootPrompt.classList.remove("hidden");
    folderSection.classList.add("hidden");
    photosSection.classList.add("hidden");
    fabAddFolder.classList.add("hidden");
    fabTakePhoto.classList.add("hidden");
}

function showFolderList() {
    rootPrompt.classList.add("hidden");
    folderSection.classList.remove("hidden");
    photosSection.classList.add("hidden");
    fabAddFolder.classList.remove("hidden");
    fabTakePhoto.classList.add("hidden");
}

function showPhotos() {
    folderSection.classList.add("hidden");
    photosSection.classList.remove("hidden");
    fabAddFolder.classList.add("hidden");
    fabTakePhoto.classList.remove("hidden");
}


/* ============================================================
   LISTAR CARPETAS
============================================================ */
async function loadFolders() {
    folderList.innerHTML = "";

    try {
        for await (const entry of rootHandle.values()) {
            if (entry.kind === "directory") {
                addFolderItem(entry.name);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function addFolderItem(name) {
    const li = document.createElement("li");
    li.className = "folder-item";

    li.innerHTML = `
        <span class="material-symbols-rounded">folder</span>
        ${name}
    `;

    li.addEventListener("click", () => openFolder(name));

    folderList.appendChild(li);
}


/* ============================================================
   ABRIR CARPETA → MOSTRAR FOTOS
============================================================ */
async function openFolder(folderName) {
    currentFolderName = folderName;
    currentFolderNameEl.textContent = folderName;

    currentFolderHandle = await rootHandle.getDirectoryHandle(folderName);

    showPhotos();
    loadPhotos();
}


/* ============================================================
   LISTAR FOTOS EN UNA CARPETA
============================================================ */
async function loadPhotos() {
    photosGrid.innerHTML = "";

    for await (const entry of currentFolderHandle.values()) {
        if (entry.kind === "file") {
            const file = await entry.getFile();
            const url = URL.createObjectURL(file);

            const img = document.createElement("img");
            img.src = url;

            photosGrid.appendChild(img);
        }
    }
}


/* ============================================================
   FAB — CREAR NUEVA CARPETA
============================================================ */
fabAddFolder.addEventListener("click", async () => {
    const name = prompt("Nombre de la nueva carpeta:");

    if (!name || name.trim() === "") return;

    await rootHandle.getDirectoryHandle(name, { create: true });

    loadFolders();
});


/* ============================================================
   FAB — TOMAR FOTO
============================================================ */
fabTakePhoto.addEventListener("click", () => {
    openCamera();
});


/* ============================================================
   GUARDAR FOTO DESDE camera.js
============================================================ */
async function savePhoto(blob) {
    if (!currentFolderHandle) return;

    const filename = "IMG_" + Date.now() + ".jpg";
    const fileHandle = await currentFolderHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();

    await writable.write(blob);
    await writable.close();

    loadPhotos();
}


/* ============================================================
   VOLVER A LISTA DE CARPETAS
============================================================ */
backFolders.addEventListener("click", () => {
    showFolderList();
    loadFolders();
});


/* ============================================================
   SERIALIZAR HANDLE
============================================================ */
async function handleToKey(handle) {
    return await window.showSaveFilePicker ?
        await handle.requestPermission({ mode: "readwrite" }) && await handle.name :
        handle.name;
}

async function keyToHandle(name) {
    const dir = await window.showDirectoryPicker();
    return await dir.getDirectoryHandle("ColdPics");
}
