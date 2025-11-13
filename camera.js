/* ============================================================
   ColdPics - Cámara PRO (Flash + Switch + Full Quality)
   Autor: ChatGPT (para Felipe Pardo)
============================================================ */

const cameraModal = document.getElementById("cameraModal");
const cameraView = document.getElementById("cameraView");
const snapBtn = document.getElementById("snapBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");

let flashBtn, switchBtn;
let cameraStream = null;
let useTorch = false;
let currentFacing = "environment"; // por defecto cámara trasera

/* ============================================================
   CREAR BOTONES EXTRA (FLASH + SWITCH)
============================================================ */
function setupExtraButtons() {
    if (document.getElementById("flashBtn")) return;

    flashBtn = document.createElement("button");
    flashBtn.id = "flashBtn";
    flashBtn.className = "camera-extra material-symbols-rounded";
    flashBtn.textContent = "flash_on";

    switchBtn = document.createElement("button");
    switchBtn.id = "switchBtn";
    switchBtn.className = "camera-extra material-symbols-rounded";
    switchBtn.textContent = "cameraswitch";

    cameraModal.appendChild(flashBtn);
    cameraModal.appendChild(switchBtn);

    flashBtn.addEventListener("click", toggleFlash);
    switchBtn.addEventListener("click", switchCamera);
}


/* ============================================================
   ABRIR CÁMARA (PRO)
============================================================ */
async function openCamera() {
    setupExtraButtons();
    cameraModal.classList.remove("hidden");

    await startCamera(currentFacing);
}


/* ============================================================
   INICIAR STREAM CON CONFIGURACIÓN PRO
============================================================ */
async function startCamera(facingMode) {
    stopCamera();

    const constraints = {
        video: {
            facingMode,
            width: { ideal: 4000 },
            height: { ideal: 3000 },
            frameRate: { ideal: 30 }
        },
        audio: false
    };

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraView.srcObject = cameraStream;

        await enableFlashIfPossible();

    } catch (e) {
        console.error("Error iniciando cámara:", e);
        closeCamera();
    }
}


/* ============================================================
   CAMBIAR DE CÁMARA (FRONTAL ↔ TRASERA)
============================================================ */
async function switchCamera() {
    currentFacing =
        currentFacing === "environment" ? "user" : "environment";

    useTorch = false;
    if (flashBtn) flashBtn.style.opacity = currentFacing === "environment" ? "1" : "0.4";

    await startCamera(currentFacing);
}


/* ============================================================
   TORCH / FLASH
============================================================ */
async function enableFlashIfPossible() {
    const track = cameraStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (!capabilities.torch) {
        flashBtn.style.opacity = "0.4"; // no soporta torch
        return;
    }

    flashBtn.style.opacity = "1.0";
}

async function toggleFlash() {
    const track = cameraStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (!capabilities.torch) return;

    useTorch = !useTorch;

    try {
        await track.applyConstraints({
            advanced: [{ torch: useTorch }]
        });

        flashBtn.textContent = useTorch ? "flash_off" : "flash_on";
    } catch (e) {
        console.log("Torch no disponible:", e);
    }
}


/* ============================================================
   CAPTURAR FOTO (FULL QUALITY → COMPRESIÓN 800×1000)
============================================================ */
snapBtn.addEventListener("click", async () => {
    if (!cameraStream) return;

    const track = cameraStream.getVideoTracks()[0];
    const settings = track.getSettings();

    const videoWidth = settings.width;
    const videoHeight = settings.height;

    // Canvas para capturar frame nativo
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;

    const ctx = canvas.getContext("2d");

    const videoRatio = videoWidth / videoHeight;
    const targetRatio = canvas.width / canvas.height;

    let sw, sh, sx, sy;

    if (videoRatio > targetRatio) {
        sh = videoHeight;
        sw = sh * targetRatio;
        sx = (videoWidth - sw) / 2;
        sy = 0;
    } else {
        sw = videoWidth;
        sh = sw / targetRatio;
        sx = 0;
        sy = (videoHeight - sh) / 2;
    }

    ctx.drawImage(
        cameraView,
        sx, sy, sw, sh,
        0, 0, canvas.width, canvas.height
    );

    canvas.toBlob(
        async (blob) => {
            if (!blob) return;
            await savePhoto(blob);
            closeCamera();
        },
        "image/jpeg",
        0.92
    );
});


/* ============================================================
   CERRAR CÁMARA
============================================================ */
function stopCamera() {
    if (!cameraStream) return;

    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
}

function closeCamera() {
    stopCamera();
    cameraModal.classList.add("hidden");
}

closeCameraBtn.addEventListener("click", closeCamera);


/* ============================================================
   ESTILOS DE BOTONES EXTRAS (FLASH / SWITCH)
============================================================ */
const style = document.createElement("style");
style.innerHTML = `
.camera-extra {
    position: absolute;
    top: 20px;
    right: 20px;
    background: #232323;
    color: white;
    border: none;
    padding: 12px;
    font-size: 28px;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
#switchBtn { right: 80px; }
#flashBtn { right: 20px; }
`;
document.head.appendChild(style);
