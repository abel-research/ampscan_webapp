
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

    uploadInput.addEventListener('change', function () {
        // Get the file from the upload button
        const files = uploadInput.files;
        if (!files.length) {
            // Check file is selected
            // If not don't do anything
            return;
        }
        const formData = new FormData();
        formData.append('user_file', files[0]);
        formData.append("session", session_id);

        // Send upload request
        fetch("upload/scan", {
            method: 'POST',
            body: formData,
            headers: {
                "X-CSRFToken": csrftoken,
            }
        })
            .then(function (response) {
                // Convert response to json
                return response.json();
            })
            .then(function (jsonResponse) {
                objects[jsonResponse["objID"]] =
                    new AmpObjectContainer(jsonResponse["objID"], jsonResponse["properties"]["display"], jsonResponse["properties"]["type"]);
                downloadPolyDataAndUpdate(jsonResponse["objID"]);
                uploadInput.value = null;
            });
    }, false);
}
