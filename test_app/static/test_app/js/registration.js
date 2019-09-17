
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

function updateRegistration() {
    for (i in objects) {
        if (objects[i].name === getRegistrationBaseline()) {
            objects[i].actor.setVisibility(true);
            // if (alignMovingColour != null) {
            //     objects[i].changeColourTemp(document.getElementById("alignMovingColour").value);
            //     objects[i].changeOpacityTemp(document.getElementById("alignMovingOpacity").value);
            // }
        } else if (objects[i].name === getRegistrationTarget()){
            objects[i].actor.setVisibility(true);
            // if (alignStaticColour != null) {
            //     objects[i].changeColourTemp(document.getElementById("alignStaticColour").value);
            //     objects[i].changeOpacityTemp(document.getElementById("alignStaticOpacity").value);
            // }
        } else {
            objects[i].actor.setVisibility(false);
        }
    }
    refreshVTK();
}


function resetRegistrationDropDowns() {
    // Set moving and static to be blank
    const dropdown1 = document.getElementById("registerBaselineDropdown");
    dropdown1.selectedIndex = -1;
    const dropdown2 = document.getElementById("registerTargetDropdown");
    dropdown2.selectedIndex = -1
}


function runRegistration() {
    const formData = new FormData();

    formData.append("session", session_id);
    formData.append("baselineID", getRegistrationBaseline());
    formData.append("targetID", getRegistrationTarget());

    // Submit the request to rotate
    fetch("process/register", {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(function(response) {
        // Convert response to json
        return response.json();
    })
    .then(function (jsonResponse) {
            if (!objects.hasOwnProperty("_regObject")) {
                objects["_regObject"] = new AmpObjectContainer("_regObject", true, "reg");
            }
            downloadPolyDataAndUpdate("_regObject", function() {
            hideAllObjects();
            objects["_regObject"].setActorVisibility(true);
            document.getElementById("registrationControls").style.display = "block";
            updateScalarsMaxMin();
        });
    })
}

function exportRegObject() {
    // TODO export with new name
    // objects["_regObject"] = new AmpObjectContainer(objID, true, "reg");
    openTab(document.getElementById("defaultTabOpen"), "Home");
    hideAllObjects();
    objects["_regObject"].setActorVisibility(true);
    resetRegistrationDropDowns();
}
