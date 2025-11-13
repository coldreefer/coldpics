/* ============================================================
   ColdPics Camera Module (Professional UTIFUL-style version)
   camera.js
============================================================ */

let stream = null;
let videoElement = null;
let usingFrontCamera = false;
let torchEnabled = false;

/* UI hooks from index.html */
const cameraModal = document.getElementById("cameraModal");
const cameraView = document.getElementById("cameraView");
const snapBtn = document.getElementById("snapBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");


/* ============================================================
   1. Abrir la cámara con opciones avanzadas
============================================================ */

async function openCamera() {
    try {
        if (stream) {
            stopCamera();
        }

        const constraints = {
            audio: false,
            video: {
                facingMode: usingFrontCamera ? "user" : "environment",
                width: { ideal: 1280 },
                height: { ideal: 1920 },
                frameRate: { ideal: 30 }
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraView.srcObject = stream;

        cameraModal.classList.remove("hidden");

    } catch (err) {
        console.error("Error abriendo la cámara:", err);
        alert("No se pudo acceder a la cámara. Da permisos.");
    }
}


/* ============================================================
   2. Cerrar cámara correctamente
============================================================ */

function stopCamera() {
    if (!stream) return;

    stream.getTracks().forEach((t) => t.stop());
    stream = null;
    cameraView.srcObject = null;
}


/* ============================================================
   3. Tomar foto (800x1000, compresión pro)
============================================================ */

async function takePhoto() {
    if (!stream) return null;

    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();

    const w = settings.width;
    const h = settings.height;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;

    const ctx = canvas.getContext("2d");

    const ratio = Math.min(w / 800, h / 1000);
    const cropWidth = 800 * ratio;
    const cropHeight = 1000 * ratio;

    const cropX = (w - cropWidth) / 2;
    const cropY = (h - cropHeight) / 2;

    ctx.drawImage(
        cameraView,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, 800, 1000
    );

    const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.82)
    );

    return blob;
}


/* ============================================================
   4. Modo documento simple (más luminoso)
============================================================ */

async function takeDocumentPhoto() {
    if (!stream) return null;

    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();

    const w = settings.width;
    const h = settings.height;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;

    const ctx = canvas.getContext("2d");

    ctx.filter = "brightness(1.15) contrast(1.1)";

    ctx.drawImage(cameraView, 0, 0, 800, 1000);

    const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
    );

    return blob;
}


/* ============================================================
   5. Modo ráfaga (toma muchas fotos sin cerrar cámara)
============================================================ */

async function takeBurst(count = 5, delay = 200) {
    const photos = [];

    for (let i = 0; i < count; i++) {
        const blob = await takePhoto();
        if (blob) photos.push(blob);
        await new Promise((res) => setTimeout(res, delay));
    }

    return photos;
}


/* ============================================================
   6. Cambiar cámara frontal/trasera
============================================================ */

function toggleCamera() {
    usingFrontCamera = !usingFrontCamera;
    openCamera();
}


/* ============================================================
   7. Torch / Flash (si el dispositivo lo soporta)
============================================================ */

async function toggleTorch() {
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (!capabilities.torch) {
        alert("Torch no está soportado en este dispositivo.");
        return;
    }

    torchEnabled = !torchEnabled;

    await track.applyConstraints({
        advanced: [{ torch: torchEnabled }]
    });
}


/* ============================================================
   8. Cerrar modal
============================================================ */

closeCameraBtn.onclick = () => {
    cameraModal.classList.add("hidden");
    stopCamera();
};


/* ============================================================
   9. Integración con el botón frío “Tomar Foto”
============================================================ */

async function openCameraAndTakePhoto() {
    await openCamera();

    return new Promise((resolve) => {
        snapBtn.onclick = async () => {
            const photo = await takePhoto();
            cameraModal.classList.add("hidden");
            stopCamera();
            resolve(photo);
        };
    });
}


/* ============================================================
   10. Funciones de documento y ráfaga para integrar luego
============================================================ */

async function openCameraAndTakeDocument() {
    await openCamera();

    return new Promise((resolve) => {
        snapBtn.onclick = async () => {
            const photo = await takeDocumentPhoto();
            cameraModal.classList.add("hidden");
            stopCamera();
            resolve(photo);
        };
    });
}


async function openCameraAndBurst(count = 5) {
    await openCamera();

    return new Promise((resolve) => {
        snapBtn.onclick = async () => {
            const photos = await takeBurst(count);
            cameraModal.classList.add("hidden");
            stopCamera();
            resolve(photos);
        };
    });
}
