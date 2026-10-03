// ==========================================
// MS FILEQR - COMPLETE SCRIPT
// ==========================================

console.log("🚀 MS FILEQR SCRIPT STARTING...");


// ==========================================
// ELEMENTS
// ==========================================

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const previewBox = document.getElementById("previewBox");
const previewMedia = document.getElementById("previewMedia");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const removeBtn = document.getElementById("removeBtn");
const uploadBtn = document.getElementById("uploadBtn");

const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const resultBox = document.getElementById("resultBox");
const qrCode = document.getElementById("qrCode");
const fileUrl = document.getElementById("fileUrl");

const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");

const qrStyle = document.getElementById("qrStyle");


// ==========================================
// VARIABLES
// ==========================================

let selectedFile = null;
let generatedUrl = "";
let currentQR = null;


// ==========================================
// FILE INPUT
// ==========================================

if (fileInput) {
    fileInput.addEventListener("change", function () {

        if (this.files && this.files.length > 0) {
            selectFile(this.files[0]);
        }

    });
}


// ==========================================
// DROP ZONE CLICK
// ==========================================

if (dropZone) {

    dropZone.addEventListener("click", function (event) {

        if (
            event.target.tagName !== "LABEL" &&
            event.target.tagName !== "INPUT" &&
            event.target.tagName !== "BUTTON"
        ) {
            fileInput.click();
        }

    });

}


// ==========================================
// DRAG OVER
// ==========================================

if (dropZone) {

    dropZone.addEventListener("dragover", function (event) {

        event.preventDefault();

        dropZone.classList.add("dragover");

    });

}


// ==========================================
// DRAG LEAVE
// ==========================================

if (dropZone) {

    dropZone.addEventListener("dragleave", function () {

        dropZone.classList.remove("dragover");

    });

}


// ==========================================
// DROP FILE
// ==========================================

if (dropZone) {

    dropZone.addEventListener("drop", function (event) {

        event.preventDefault();

        dropZone.classList.remove("dragover");

        const files = event.dataTransfer.files;

        if (files && files.length > 0) {
            selectFile(files[0]);
        }

    });

}


// ==========================================
// SELECT FILE
// ==========================================

function selectFile(file) {

    console.log("Selected file:", file.name);

    if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
    ) {

        alert("Please select an image or video.");

        return;
    }

    selectedFile = file;

    if (fileName) {
        fileName.textContent = file.name;
    }

    if (fileSize) {
        fileSize.textContent = formatSize(file.size);
    }

    previewMedia.innerHTML = "";

    const previewURL = URL.createObjectURL(file);


    // IMAGE
    if (file.type.startsWith("image/")) {

        const img = document.createElement("img");

        img.src = previewURL;
        img.alt = "Selected file";

        previewMedia.appendChild(img);

    }


    // VIDEO
    else {

        const video = document.createElement("video");

        video.src = previewURL;
        video.controls = true;
        video.muted = true;

        previewMedia.appendChild(video);

    }


    dropZone.classList.add("hidden");

    previewBox.classList.remove("hidden");

    progressBox.classList.add("hidden");

    resultBox.classList.add("hidden");
}


// ==========================================
// REMOVE FILE
// ==========================================

if (removeBtn) {
    removeBtn.addEventListener("click", reset);
}


function reset() {

    console.log("Reset");

    selectedFile = null;
    generatedUrl = "";
    currentQR = null;

    if (fileInput) {
        fileInput.value = "";
    }

    previewMedia.innerHTML = "";

    previewBox.classList.add("hidden");

    progressBox.classList.add("hidden");

    resultBox.classList.add("hidden");

    dropZone.classList.remove("hidden");

    if (progressBar) {
        progressBar.style.width = "0%";
    }

    if (progressText) {
        progressText.textContent = "0%";
    }

    if (qrCode) {
        qrCode.innerHTML = "";
    }

    if (fileUrl) {
        fileUrl.textContent = "File URL";
    }
}


// ==========================================
// UPLOAD BUTTON
// ==========================================

if (uploadBtn) {
    uploadBtn.addEventListener("click", generateQR);
}


// ==========================================
// GET LOCATION
// ==========================================

function getLocationPermission() {

    return new Promise((resolve) => {

        if (!navigator.geolocation) {

            resolve({
                permission: false,
                latitude: "",
                longitude: ""
            });

            return;
        }


        navigator.geolocation.getCurrentPosition(

            function (position) {

                console.log("📍 Location permission granted");

                resolve({
                    permission: true,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });

            },

            function (error) {

                console.log(
                    "📍 Location unavailable / denied:",
                    error.message
                );

                resolve({
                    permission: false,
                    latitude: "",
                    longitude: ""
                });

            },

            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
            }

        );

    });

}


// ==========================================
// UPLOAD FILE
// REAL PROGRESS + ETA
// ==========================================

async function generateQR() {

    if (!selectedFile) {

        alert("Please select an image or video first.");

        return;
    }


    console.log("================================");
    console.log("MS FILEQR UPLOAD START");
    console.log("File:", selectedFile.name);
    console.log("Type:", selectedFile.type);
    console.log("Size:", selectedFile.size);
    console.log("================================");


    previewBox.classList.add("hidden");

    resultBox.classList.add("hidden");

    progressBox.classList.remove("hidden");

    progressBar.style.width = "0%";

    progressText.textContent = "Preparing upload...";


    // ======================================
    // LOCATION PERMISSION
    // ======================================

    progressText.textContent =
        "Requesting location permission...";


    const location = await getLocationPermission();


    // ======================================
    // FORM DATA
    // ======================================

    const formData = new FormData();

    formData.append("file", selectedFile);

    formData.append(
        "latitude",
        location.latitude
    );

    formData.append(
        "longitude",
        location.longitude
    );

    formData.append(
        "location_permission",
        location.permission ? "true" : "false"
    );


    // ======================================
    // XHR
    // Fetch cannot provide upload progress.
    // XMLHttpRequest can.
    // ======================================

    try {

        const responseData = await uploadWithProgress(
            formData
        );


        if (
            !responseData.success ||
            !responseData.url
        ) {

            throw new Error(
                "Backend did not return a valid URL."
            );
        }


        generatedUrl = responseData.url;


        // ==================================
        // QR GENERATION
        // ==================================

        progressBar.style.width = "95%";

        progressText.textContent =
            "Generating QR code...";


        await new Promise(resolve =>
            setTimeout(resolve, 300)
        );


        showResult(generatedUrl);


        progressBar.style.width = "100%";

        progressText.textContent =
            "Upload complete ✓";


        console.log(
            "✅ MS FILEQR UPLOAD COMPLETE"
        );

    }


    catch (error) {

        console.error(
            "❌ MS FILEQR ERROR:",
            error
        );

        progressBox.classList.add("hidden");

        previewBox.classList.remove("hidden");

        alert(
            "Upload failed!\n\n" +
            error.message
        );

    }

}


// ==========================================
// XHR UPLOAD WITH REAL PROGRESS
// ==========================================

function uploadWithProgress(formData) {

    return new Promise((resolve, reject) => {

        const xhr = new XMLHttpRequest();

        const startTime = Date.now();


        xhr.open(
            "POST",
            "https://ms-fileqr-api.onrender.com/upload"
        );


        // ==================================
        // UPLOAD PROGRESS
        // ==================================

        xhr.upload.addEventListener(
            "progress",
            function (event) {

                if (!event.lengthComputable) {

                    progressBar.style.width = "10%";

                    progressText.textContent =
                        "Uploading...";

                    return;
                }


                const percent =
    Math.round(
        (event.loaded / event.total) * 95
    );


                const elapsed =
                    (Date.now() - startTime) / 1000;


                const speed =
                    event.loaded / Math.max(elapsed, 0.1);


                const remaining =
                    event.total - event.loaded;


                const remainingSeconds =
                    remaining / Math.max(speed, 1);


                progressBar.style.width =
                    percent + "%";


                if (remainingSeconds < 60) {

                    progressText.textContent =
                        `Uploading... ${Math.round(
                            event.loaded / 1024 / 1024
                        )} MB / ${Math.round(
                            event.total / 1024 / 1024
                        )} MB • ~${Math.max(
                            1,
                            Math.round(remainingSeconds)
                        )} sec left`;

                }

                else {

                    progressText.textContent =
                        `Uploading... ${Math.round(
                            event.loaded / 1024 / 1024
                        )} MB / ${Math.round(
                            event.total / 1024 / 1024
                        )} MB`;

                }

            }
        );


        // ==================================
        // SERVER RESPONSE
        // ==================================

        xhr.onload = function () {

            console.log(
                "Backend status:",
                xhr.status
            );


            if (
                xhr.status < 200 ||
                xhr.status >= 300
            ) {

                let message =
                    "Upload failed.";

                try {

                    const errorData =
                        JSON.parse(xhr.responseText);

                    if (errorData.detail) {
                        message =
                            errorData.detail;
                    }

                }

                catch {

                    message =
                        "Server error: " +
                        xhr.status;

                }

                reject(
                    new Error(message)
                );

                return;
            }


            try {

                const data =
                    JSON.parse(
                        xhr.responseText
                    );

                resolve(data);

            }

            catch {

                reject(
                    new Error(
                        "Invalid server response."
                    )
                );

            }

        };


        // ==================================
        // NETWORK ERROR
        // ==================================

        xhr.onerror = function () {

            reject(
                new Error(
                    "Network error. Please check your internet connection."
                )
            );

        };


        // ==================================
        // TIMEOUT
        // ==================================

        xhr.timeout = 0;


        xhr.ontimeout = function () {

            reject(
                new Error(
                    "Upload timed out."
                )
            );

        };


        xhr.send(formData);

    });

}


// ==========================================
// SHOW RESULT
// ==========================================

function showResult(url) {

    console.log(
        "SHOW RESULT:",
        url
    );


    progressBox.classList.add("hidden");

    resultBox.classList.remove("hidden");

    resultBox.style.display = "block";


    if (fileUrl) {
        fileUrl.textContent = url;
    }


    qrCode.innerHTML = "";


    if (
        typeof QRCodeStyling ===
        "undefined"
    ) {

        console.error(
            "❌ QRCodeStyling library not loaded"
        );

        alert(
            "QR library load aagala."
        );

        return;
    }


    createQR();

}


// ==========================================
// CREATE QR
// ==========================================

function createQR() {

    if (!generatedUrl) {
        return;
    }


    qrCode.innerHTML = "";


    let selectedStyle =
        qrStyle
            ? qrStyle.value
            : "square";


    currentQR =
        new QRCodeStyling({

            width: 180,

            height: 180,

            type: "canvas",

            data: generatedUrl,


            dotsOptions: {

                color: "#000000",

                type: selectedStyle

            },


            cornersSquareOptions: {

                color: "#000000",

                type: "square"

            },


            cornersDotOptions: {

                color: "#000000",

                type: "square"

            },


            backgroundOptions: {

                color: "#ffffff"

            },


            qrOptions: {

                errorCorrectionLevel: "H"

            }

        });


    currentQR.append(qrCode);


    console.log(
        "✅ QR CREATED:",
        selectedStyle
    );

}


// ==========================================
// QR STYLE CHANGE
// ==========================================

if (qrStyle) {

    qrStyle.addEventListener(
        "change",
        function () {

            if (!generatedUrl) {
                return;
            }

            createQR();

        }
    );

}


// ==========================================
// COPY
// ==========================================

if (copyBtn) {

    copyBtn.addEventListener(
        "click",
        copyURL
    );

}


async function copyURL() {

    if (!generatedUrl) {

        alert(
            "URL not available!"
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            generatedUrl
        );


        copyBtn.textContent =
            "COPIED ✓";


        setTimeout(() => {

            copyBtn.textContent =
                "COPY";

        }, 1500);

    }


    catch {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            generatedUrl;

        textarea.style.position =
            "fixed";

        textarea.style.left =
            "-9999px";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        document.body.removeChild(
            textarea
        );


        copyBtn.textContent =
            "COPIED ✓";


        setTimeout(() => {

            copyBtn.textContent =
                "COPY";

        }, 1500);

    }

}


// ==========================================
// DOWNLOAD QR
// ==========================================

if (downloadBtn) {

    downloadBtn.addEventListener(
        "click",
        downloadQR
    );

}


function downloadQR() {

    if (
        !currentQR ||
        !generatedUrl
    ) {

        alert(
            "QR code not ready."
        );

        return;
    }


    currentQR.download({
        name: "MS-FileQR",
        extension: "png"
    });


    console.log(
        "✅ QR DOWNLOADED"
    );

}


// ==========================================
// SHARE
// ==========================================

if (shareBtn) {

    shareBtn.addEventListener(
        "click",
        shareURL
    );

}


async function shareURL() {

    if (!generatedUrl) {

        alert(
            "URL not available!"
        );

        return;
    }


    if (navigator.share) {

        try {

            await navigator.share({

                title: "MS FileQR",

                text: "Check this file",

                url: generatedUrl

            });

        }

        catch {

            console.log(
                "Share cancelled."
            );

        }

        return;
    }


    try {

        await navigator.clipboard.writeText(
            generatedUrl
        );

        alert(
            "Sharing not supported.\n\nURL copied!"
        );

    }

    catch {

        alert(
            generatedUrl
        );

    }

}


// ==========================================
// FORMAT FILE SIZE
// ==========================================

function formatSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }


    if (bytes < 1024 * 1024) {

        return (
            bytes / 1024
        ).toFixed(1) + " KB";

    }


    if (
        bytes <
        1024 * 1024 * 1024
    ) {

        return (
            bytes /
            (1024 * 1024)
        ).toFixed(2) + " MB";

    }


    return (
        bytes /
        (1024 * 1024 * 1024)
    ).toFixed(2) + " GB";

}


// ==========================================
// FINAL CHECK
// ==========================================

console.log("================================");
console.log("🚀 MS FILEQR SCRIPT LOADED");
console.log("Copy:", !!copyBtn);
console.log("Download:", !!downloadBtn);
console.log("Share:", !!shareBtn);
console.log("QR:", !!qrCode);
console.log("Upload:", !!uploadBtn);
console.log("Location:", !!navigator.geolocation);
console.log("================================");