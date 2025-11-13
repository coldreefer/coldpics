/* ============================================================
   ColdPics - Lógica principal
   app.js
   - Crear carpeta raíz
   - Crear subcarpetas
   - Listar carpetas y fotos
   - Guardar fotos reales en filesystem
============================================================ */

/* ==== REFERENCIAS A ELEMENTOS DE UI ==== */
const rootPrompt = document.getElementById("rootPrompt");
const initRootBtn = document.getElementById("initRootBtn");

const folderSection = document.getElementById("folderSection");
const folderList = document.getElementById("folderList");

const photosSection = document.getElementById("photosSection");
const photosGrid = document.getElementById("photosGrid");

const backToFolders = document.getElementById("backToFolders");
const currentFolderName = document.getElementById("currentFolderName");

const addFolderBtn = document.getElementById("addFolderBtn");
const takePhotoBtn = document.getElementById("takePhotoBtn");


/* ============================================================
   1. CREAR CARPETA RAÍZ EN /Pictures/ColdPics
============================================================ */

let rootHandle = null;

async function createRootFolder() {
    try {
        const dir = await navigator.storage.getDirectory();

        const pics = await dir.getDirectoryHandle("Pictures", { create: true });
        const cold = await pics.getDirectoryHandle("ColdPics", { create: true });

        rootHandle = cold;

        localStorage.setItem("coldpics_root", "OK");

        console.log("Carpeta ColdPics lista.");
        return true;
    } catch (err) {
        console.error("Error creando la carpeta raíz:", err);
        alert("El navegador no permitió crear la carpeta.");
    }
}


/* ============================================================
   2. LISTAR CARPETAS DENTRO DE ColdPics
============================================================ */

async function listFolders() {
    folderList.innerHTML = "";

    for await (const [name, handle] of rootHandle.entries()) {
        if (handle.kind === "directory") {
            const li = document.createElement("li");
            li.textContent = name;

            li.onclick = () => openFolder(name);

            folderList.appendChild(li);
        }
    }
}


/* ============================================================
   3. CREAR SUBCARPETA
============================================================ */

async function createSubfolder() {
    const name = prompt("Nombre de la carpeta:");

    if (!name) return;

    try {
        await rootHandle.getDirectoryHandle(name, { create: true });
        listFolders();
    } catch (err) {
        console.error("Error creando carpeta:", err);
    }
}


/* ============================================================
   4. ABRIR UNA CARPETA Y VER FOTOS
============================================================ */

let currentFolder = null;

async function openFolder(name) {
    currentFolder = await rootHandle.getDirectoryHandle(name);

    currentFolderName.textContent = name;
    photosGrid.innerHTML = "";

    folderSection.classList.add("hidden");
    photosSection.classList.remove("hidden");

    listPhotosInCurrentFolder();
}


/* ============================================================
   5. LISTAR FOTOS DENTRO DE UNA CARPETA
============================================================ */

async function listPhotosInCurrentFolder() {
    photosGrid.innerHTML = "";

    for await (const [name, handle] of currentFolder.entries()) {
        if (handle.kind === "file") {
            const file = await handle.getFile();
            const url = URL.createObjectURL(file);

            const img = document.createElement("img");
            img.src = url;

            photosGrid.appendChild(img);
        }
    }
}


/* ============================================================
   6. GUARDAR FOTO EN CARPETA REAL
============================================================ */

async function savePhotoToFolder(blob) {
    try {
        const fileName = `IMG_${Date.now()}.jpg`;

        const newFile = await currentFolder.getFileHandle(fileName, { create: true });
        const writable = await newFile.createWritable();

        await writable.write(blob);
        await writable.close();

        await listPhotosInCurrentFolder();

    } catch (err) {
        console.error("Error guardando foto:", err);
    }
}


/* ============================================================
   7. EVENTOS DE BOTONES
============================================================ */

backToFolders.onclick = () => {
    photosSection.classList.add("hidden");
    folderSection.classList.remove("hidden");
};

addFolderBtn.onclick = () => createSubfolder();

takePhotoBtn.onclick = async () => {
    const blob = await openCameraAndTakePhoto();
    if (blob) savePhotoToFolder(blob);
};

initRootBtn.onclick = async () => {
    await createRootFolder();
    initializeApp();
};


/* ============================================================
   8. INICIALIZAR APP
============================================================ */

async function initializeApp() {
    const rootExists = localStorage.getItem("coldpics_root");

    if (!rootExists) {
        rootPrompt.classList.remove("hidden");
        return;
    }

    const dir = await navigator.storage.getDirectory();
    const pics = await dir.getDirectoryHandle("Pictures");
    rootHandle = await pics.getDirectoryHandle("ColdPics");

    rootPrompt.classList.add("hidden");
    folderSection.classList.remove("hidden");

    listFolders();
}

initializeApp();
