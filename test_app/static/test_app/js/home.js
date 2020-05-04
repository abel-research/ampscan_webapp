
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

function updateHome() {
    let dropdown = document.getElementById("homeDropdown");
    let si = dropdown.selectedIndex;
    for (const i in objects) {
        dropdown.options[dropdown.options.length] = undefined;
    }
    dropdown.options.length = 0;
    dropdown.options[0] = new Option("", "");
    let anObjs = getAnalyseObjects();
    for (let i = 0; i < anObjs.length; i ++) {
        dropdown.options[dropdown.options.length] = new Option(anObjs[i], anObjs[i]);
    }
    dropdown.selectedIndex = si;

    // Select something if nothing is selected
    if (getHomeTarget() === "" && dropdown.options.length > 1) {
        dropdown.selectedIndex = 1;
    }

    // for (const i in objects) {
    //     if (objects[i].name ===getHomeTarget()) {
    //         objects[i].actor.setVisibility(true);
    //     } else {
    //         objects[i].actor.setVisibility(false);
    //     }
    // }
}

// SMOOTH OBJECT
function smoothObject() {
    const formData = new FormData();
    formData.append("session", session_id);
    formData.append("objID", getHomeTarget());

    fetch("home/smooth", {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (jsonresponse) {
        downloadPolyDataAndUpdate(getHomeTarget());
    });
}


// TRIM OBJECT
function trimObjectButtonPressed() {
    trimObject(getTrimHeight());
}

function trimObject(height) {

    const formData = new FormData();
    formData.append("session", session_id);
    formData.append("objID", getHomeTarget());
    console.log(height);
    formData.append("height", height);

    fetch("home/trim", {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (jsonresponse) {
        downloadPolyDataAndUpdate(getHomeTarget());
    });
}

// Trim height box
let trimHeight = 0;
function getTrimHeight() {
    return trimHeight;
}
function setTrimHeight(val) {
    trimHeight = val;
}