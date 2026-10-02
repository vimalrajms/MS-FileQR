// ==========================================
// MS FILEQR - COMPLETE SCRIPT
// ==========================================

console.log("🚀 MS FILEQR SCRIPT STARTING...");

// ---------- ELEMENTS ----------

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


// ---------- VARIABLES ----------

let selectedFile = null;
let generatedUrl = "";


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

        // Avoid triggering twice
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

    // Check file type
    if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
    ) {

        alert("Please select an image or video.");

        return;
    }

    // Save file
    selectedFile = file;

    // File name
    if (fileName) {
        fileName.textContent = file.name;
    }

    // File size
    if (fileSize) {
        fileSize.textContent = formatSize(file.size);
    }

    // Clear old preview
    previewMedia.innerHTML = "";

    // Create preview URL
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


    // UI
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

    if (fileInput) {
        fileInput.value = "";
    }

    previewMedia.innerHTML = "";

    previewBox.classList.add("hidden");

    progressBox.classList.add("hidden");

    resultBox.classList.add("hidden");

    dropZone.classList.remove("hidden");

    progressBar.style.width = "0%";

    progressText.textContent = "0%";

    qrCode.innerHTML = "";

    if (fileUrl) {
        fileUrl.textContent = "File URL";
    }

}


// ==========================================
// GENERATE QR BUTTON
// ==========================================

if (uploadBtn) {

    uploadBtn.addEventListener("click", generateQR);

}


// ==========================================
// UPLOAD FILE
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


    // Show progress
    previewBox.classList.add("hidden");

    resultBox.classList.add("hidden");

    progressBox.classList.remove("hidden");

    progressBar.style.width = "10%";

    progressText.textContent = "Uploading...";


    // Create FormData
    const formData = new FormData();

    formData.append("file", selectedFile);


    try {

        progressBar.style.width = "20%";

        progressText.textContent = "Connecting...";


        // =====================================
        // IMPORTANT
        // NO MARKDOWN URL HERE
        // =====================================

        const response = await fetch(
    "https://ms-fileqr-api.onrender.com/upload",
    {
        method: "POST",
        body: formData
    }
);


        console.log("Backend status:", response.status);


        progressBar.style.width = "60%";

        progressText.textContent = "Processing...";


        // Check server response
        if (!response.ok) {

            let message = "Upload failed.";

            try {

                const errorData = await response.json();

                if (errorData.detail) {
                    message = errorData.detail;
                }

            } catch {

                message = "Server error: " + response.status;

            }

            throw new Error(message);
        }


        // JSON response
        const data = await response.json();

        console.log("Backend response:", data);


        // Check URL
        if (!data.success || !data.url) {

            throw new Error(
                "Backend did not return a valid URL."
            );

        }


        // Save URL
        generatedUrl = data.url;

        console.log("Generated URL:", generatedUrl);


        // QR progress
        progressBar.style.width = "85%";

        progressText.textContent = "Generating QR...";


        // Show result
        showResult(generatedUrl);


        // Complete
        progressBar.style.width = "100%";

        progressText.textContent = "Complete!";


        console.log("✅ QR GENERATED SUCCESSFULLY");

    }


    catch (error) {

        console.error("❌ MS FILEQR ERROR:", error);

        progressBox.classList.add("hidden");

        previewBox.classList.remove("hidden");

        alert(
            "Upload failed!\n\n" +
            error.message
        );

    }

}


// ==========================================
// SHOW RESULT
// ==========================================

function showResult(url) {

    console.log("SHOW RESULT:", url);


    // Hide progress
    progressBox.classList.add("hidden");


    // Show result
    resultBox.classList.remove("hidden");

    resultBox.style.display = "block";


    // Show URL
    if (fileUrl) {
        fileUrl.textContent = url;
    }


    // Clear old QR
    qrCode.innerHTML = "";


    // Check QR library
    if (typeof QRCode === "undefined") {

        console.error("❌ QRCode library not loaded");

        alert(
            "QR Code library load aagala.\n\n" +
            "Check qrcode.min.js"
        );

        return;
    }


    try {

        new QRCode(qrCode, {

            text: url,

            width: 180,

            height: 180,

            correctLevel: QRCode.CorrectLevel.H

        });

        console.log("✅ QR CREATED");

    }


    catch (error) {

        console.error(
            "QR generation error:",
            error
        );

        alert(
            "QR generate failed!\n\n" +
            error.message
        );

    }

}


// ==========================================
// COPY BUTTON
// ==========================================

if (copyBtn) {

    copyBtn.addEventListener("click", copyURL);

}


async function copyURL() {

    if (!generatedUrl) {

        alert("URL not available!");

        return;
    }


    try {

        // Modern browser
        await navigator.clipboard.writeText(
            generatedUrl
        );

        copyBtn.textContent = "COPIED ✓";

        setTimeout(function () {

            copyBtn.textContent = "COPY";

        }, 1500);

        console.log("✅ URL COPIED");

    }


    catch (error) {

        console.log(
            "Clipboard API failed. Using fallback."
        );


        // Fallback
        const textarea =
            document.createElement("textarea");

        textarea.value = generatedUrl;

        textarea.style.position = "fixed";

        textarea.style.left = "-9999px";

        document.body.appendChild(textarea);

        textarea.focus();

        textarea.select();


        try {

            document.execCommand("copy");

            copyBtn.textContent = "COPIED ✓";

            setTimeout(function () {

                copyBtn.textContent = "COPY";

            }, 1500);

        }

        catch (err) {

            alert(
                "Copy failed!\n\n" +
                generatedUrl
            );

        }


        document.body.removeChild(textarea);

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

    console.log("DOWNLOAD QR CLICKED");


    const canvas =
        qrCode.querySelector("canvas");


    if (!canvas) {

        alert("QR Code not found!");

        return;
    }


    canvas.toBlob(function (blob) {

        if (!blob) {

            alert("QR download failed!");

            return;
        }


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download = "MS-FileQR.png";


        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);


        setTimeout(function () {

            URL.revokeObjectURL(url);

        }, 1000);


        console.log("✅ QR DOWNLOADED");

    }, "image/png");

}


// ==========================================
// SHARE BUTTON
// ==========================================

if (shareBtn) {

    shareBtn.addEventListener(
        "click",
        shareURL
    );

}


async function shareURL() {

    console.log("SHARE CLICKED");


    if (!generatedUrl) {

        alert("URL not available!");

        return;
    }


    // Native Share
    if (navigator.share) {

        try {

            await navigator.share({

                title: "MS FileQR",

                text: "Check this file",

                url: generatedUrl

            });

            console.log("✅ SHARED");

        }

        catch (error) {

            console.log(
                "Share cancelled."
            );

        }

        return;
    }


    // Browser doesn't support share
    try {

        await navigator.clipboard.writeText(
            generatedUrl
        );

        alert(
            "Sharing not supported.\n\n" +
            "URL copied!"
        );

    }

    catch (error) {

        alert(
            "Share not supported.\n\n" +
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


    if (bytes < 1024 * 1024 * 1024) {

        return (
            bytes / (1024 * 1024)
        ).toFixed(2) + " MB";

    }


    return (
        bytes / (1024 * 1024 * 1024)
    ).toFixed(2) + " GB";

}
copyBtn.onclick = function () {
    alert("COPY BUTTON WORKING");
};

downloadBtn.onclick = function () {
    alert("DOWNLOAD BUTTON WORKING");
};

shareBtn.onclick = function () {
    alert("SHARE BUTTON WORKING");
};

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
console.log("================================");