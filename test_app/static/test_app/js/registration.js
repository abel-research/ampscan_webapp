
// ----------------------------------------------------------------------------
// Registration
// ----------------------------------------------------------------------------

function getRegistrationTarget() {
    const dropdown = document.getElementById("registerTargetDropdown");
    if (dropdown.selectedIndex !== -1) {
        return dropdown.options[dropdown.selectedIndex].text;
    } else {
        return "";
    }
}

function setRegistrationTarget(objID) {
    const dropdown = document.getElementById("registerTargetDropdown");
    updateDropdown();
    options = dropdown.options;
    for (i = 0; i < options.length; i ++) {
        if (options[i].value === objID) {
            dropdown.selectedIndex = i;
            return;
        }
    }
    console.error("Obj not found: ".concat(objID));
}

function getRegistrationBaseline() {
    const dropdown = document.getElementById("registerBaselineDropdown");
    if (dropdown.selectedIndex !== -1) {
        return dropdown.options[dropdown.selectedIndex].text;
    } else {
        return "";
    }
}

function setRegistrationBaseline(objID) {
    const dropdown = document.getElementById("registerBaselineDropdown");
    updateDropdown();
    options = dropdown.options;
    for (i = 0; i < options.length; i ++) {
        if (options[i].value === objID) {
            dropdown.selectedIndex = i;
            return;
        }
    }
    console.error("Obj not found: ".concat(objID));
}


function goToRegistration() {
    // Change tab
    openTab(document.getElementById("registerTabButton"), "Register");

    // Put the alignment targets in the registration target and baseline selectors
    if (getAlignStatic() !== "")
        setRegistrationBaseline(getAlignStatic());
    if (getAlignMoving() !== "")
         setRegistrationTarget(getAlignMoving());

    updateRegistration();
}

function checkNameValid() {
    let newName = document.getElementById("nameInput").value;
    for (const obj in objects) {
        if (newName === obj) {
            document.getElementById("finishRegistrationButton").disabled = true;
            document.getElementById("finishRegistrationText").innerHTML = "Invalid Name: Already in use";
            return;
        }
    }
    if (newName === "") {
        document.getElementById("finishRegistrationButton").disabled = true;
        document.getElementById("finishRegistrationText").innerHTML = "Invalid Name: Too short";
        return;
    }
    document.getElementById("finishRegistrationButton").disabled = false;
    document.getElementById("finishRegistrationText").innerHTML = "";
}

function updateRegistration() {
    for (i in objects) {
        if (objects[i].name === getRegistrationBaseline()) {
            objects[i].actor.setVisibility(true);
            if (alignMovingColour != null) {
                objects[i].changeColourTemp(document.getElementById("alignMovingColour").value);
                objects[i].changeOpacityTemp(document.getElementById("alignMovingOpacity").value);
            }
        } else if (objects[i].name === getRegistrationTarget()){
            objects[i].actor.setVisibility(true);
            if (alignStaticColour != null) {
                objects[i].changeColourTemp(document.getElementById("alignStaticColour").value);
                objects[i].changeOpacityTemp(document.getElementById("alignStaticOpacity").value);
            }
        } else {
            objects[i].actor.setVisibility(false);
        }
    }
    if (getRegistrationTarget() === "" || getRegistrationBaseline() === "" || getRegistrationTarget() === getRegistrationBaseline()) {
        document.getElementById("runRegistrationButton").disabled = true;
    } else {
        document.getElementById("runRegistrationButton").disabled = false;
    }
    checkNameValid();
    updateScalarVisiblity();
    refreshVTK();
}

function updateRegistrationGraph() {
    if (objects["_regObject"] !== undefined) {
        fetchDeviationHistogram(document.getElementById("registrationGraphPanel"),
            ["_regObject"], getNumberOfColours())
    } else {
        document.getElementById("registrationGraphPanel").innerHTML = "";
    }
}


function resetRegistrationDropDowns() {
    // Set moving and static to be blank
    const dropdown1 = document.getElementById("registerBaselineDropdown");
    dropdown1.selectedIndex = -1;
    const dropdown2 = document.getElementById("registerTargetDropdown");
    dropdown2.selectedIndex = -1
}


function runRegistration() {
    // Check that registration targets are selected and different
    if (getRegistrationTarget() !== "" && getRegistrationBaseline() !== "" && getRegistrationTarget() !== getRegistrationBaseline()) {
        showProcessingScreen();

        const formData = new FormData();

        formData.append("session", session_id);
        formData.append("baselineID", getRegistrationBaseline());
        formData.append("targetID", getRegistrationTarget());
        formData.append("absolute", isAbsErrorEnabled());


        // Submit the request to rotate
        fetch("process/register", {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
            .then(function (response) {
                // Convert response to json
                return response.json();
            })
            .then(function (jsonResponse) {
                if (!objects.hasOwnProperty("_regObject")) {
                    objects["_regObject"] = new AmpObjectContainer("_regObject", true, "reg");
                }
                downloadPolyDataAndUpdate("_regObject", function () {
                    hideAllObjects();
                    objects["_regObject"].setActorVisibility(true);
                    document.getElementById("registrationControls").style.display = "block";
                    updateScalarsMaxMin();
                    updateRegistrationGraph();
                    document.getElementById("scalarBarContainer").style.display = "grid";
                    updateRegistrationGraph();
                    updateScalars("_regObject");
                    updateDoubleSliders();
                    hideProcessingScreen();
                });
            })
    }
}

function changeAbsError() {
    // lookupTable = createLUT(isAbsErrorEnabled())

}

function isAbsErrorEnabled() {
    return document.getElementById("absErrorCheckbox").checked;
}

/**
 * Export reg object with new name
 */
function exportRegObject() {
    const formData = new FormData();

    let name = document.getElementById("nameInput").value;

    formData.append("session", session_id);
    formData.append("objID", name);
    // Submit request to inform server of new name
    fetch("process/register/export", {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    }).then(function() {
        hideAllObjects();
        objects[name] = objects["_regObject"];
        objects[name].name = name;
        objects[name].setActorVisibility(true);
        delete objects["_regObject"];
        updateObjectTable();
        openTab(document.getElementById("analyseTabButton"), "Analyse");
        resetRegistrationDropDowns();
        updateScalarVisiblity();
        setVisualisationTarget(name);
        updateAnalyse();
        setAnalyseMinSlider(getMinScalar());
        setAnalyseMaxSlider(getMaxScalar());
        updateDoubleSliders();
    })
}

function exportRegCSV(name, url) {

    const formData = new FormData();

    formData.append("session", session_id);
    formData.append("objID", name);
    formData.append("numBins", getNumberOfColours());
    formData.append("scalarMin", getMinScalar());
    formData.append("scalarMax", getMaxScalar());
    // Submit request to inform server of new name
    fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(resp => resp.blob())
    .then(blob => {
        // Download file at address
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // the filename to download to
        a.download = name+'_regbins.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('File download failed'));
}

function numberOfColoursChanged() {
    if (document.getElementById("noColours").value < 6) {
        document.getElementById("noColours").value = 5;
    }
    updateLookupTable("_regObject");
    createScalarBar(lookupTable, document.getElementById("legend"));
    updateScalars("_regObject");
    updateRegistrationGraph();
}

function getNumberOfColours() {
    return document.getElementById("noColours").value/1;
}

function setRegisterMinSlider(val) {
    document.getElementById("registerMinSlider").value = val
}

function setRegisterMaxSlider(val) {
    document.getElementById("registerMaxSlider").value = val
}