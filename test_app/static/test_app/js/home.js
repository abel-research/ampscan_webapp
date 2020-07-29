
// ----------------------------------------------------------------------------
// Setup Home panel
// ----------------------------------------------------------------------------

function setupHomePanel() {
    const containerHome = document.getElementById('Home');

    // Add upload button
    var uploadInput = document.createElement("INPUT");
    uploadInput.setAttribute("accept", ".stl");
    uploadInput.setAttribute("type", "file");
    // uploadInput.style.display = "none";
    // containerHome.insertBefore(uploadInput, document.getElementById("resetCameraContainer"));


    const uploadButton = document.createElement("BUTTON");
    uploadButton.innerHTML = "Upload Scan";
    uploadButton.addEventListener('click', function () {
        uploadInput.click();
    });
    containerHome.insertBefore(uploadButton, document.getElementById("resetCameraContainer"));

    uploadInput.addEventListener('change', function(){uploadScan(uploadInput)}, false);
}
