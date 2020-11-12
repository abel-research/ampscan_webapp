

// ----------------------------------------------------------------------------
// Setup Align panel
// ----------------------------------------------------------------------------


function swapAlignTargets() {
    let moving = getAlignMoving();
    setAlignMoving(getAlignStatic());
    setAlignStatic(moving);
}

function getAlignMoving() {
    const dropdown = document.getElementById("alignMovingDropdown");
    if (dropdown.selectedIndex !== -1)
        return dropdown.options[dropdown.selectedIndex].text;
    else
        return "";
}
function setAlignMoving(objID) {
    const dropdown = document.getElementById("alignMovingDropdown");
    if (objID === "") {
        dropdown.selectedIndex = -1;
        return;
    }
    options = dropdown.options;
    for (i = 0; i < options.length; i ++) {
        if (options[i].value === objID) {
            dropdown.selectedIndex = i;
            updateAlign();
            return;
        }
    }
    console.error("Obj not found: ".concat(objID));
}
function getAlignStatic() {
    const dropdown = document.getElementById("alignStaticDropdown");
    if (dropdown.selectedIndex !== -1)
        return dropdown.options[dropdown.selectedIndex].text;
    else
        return "";
}
function setAlignStatic(objID) {
    const dropdown = document.getElementById("alignStaticDropdown");
    if (objID === "") {
        dropdown.selectedIndex = -1;
        return;
    }
    options = dropdown.options;
    for (i = 0; i < options.length; i ++) {
        if (options[i].value === objID) {
            dropdown.selectedIndex = i;
            updateAlign();
            return;
        }
    }
    console.error("Obj not found: ".concat(objID));
}

function resetAlignDropDowns() {
    // Set moving and static to be blank
    const dropdown1 = document.getElementById("alignMovingDropdown");
    dropdown1.selectedIndex = -1;
    const dropdown2 = document.getElementById("alignStaticDropdown");
    dropdown2.selectedIndex = -1
}


function runICP() {
    const formData = new FormData();
    showProcessingScreen();

    formData.append("session", session_id);
    formData.append("movingID", getAlignMoving());
    formData.append("staticID", getAlignStatic());
    console.log(session_id);
    // Submit the request to run icp
    fetch("process/align/icp", {
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
        // objects[jsonResponse["newObjID"]] = new AmpObjectContainer(jsonResponse["newObjID"], true, "align");
        downloadPolyDataAndUpdate(getAlignMoving(), function() {
            // Change the moving object to the new object
            setAlignMoving(getAlignMoving());
            updateAlign();
            hideProcessingScreen();
        });
    })
}



function runCentre(global) {
    const formData = new FormData();
    showProcessingScreen();

    formData.append("session", session_id);
    formData.append("movingID", getAlignMoving());

    // Submit the request to run icp
    let url;
    if (global) {
        url = "process/align/centre";
    } else {
        url = "process/align/centre_relative";
        formData.append("staticID", getAlignStatic());
    }
    fetch(url, {
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
        downloadPolyDataAndUpdate(getAlignMoving(), function() {
            updateAlign();
            hideProcessingScreen();
        });
    })
}

function rotate(objID, x, y, z) {
    showProcessingScreen();
    // Add the data
    var formData  = new FormData();
    formData.append("x", String(x));
    formData.append("y", String(y));
    formData.append("z", String(z));

    formData.append("objID", objID);
    formData.append("session", session_id);

    // Submit the request to rotate
    fetch("process/align/rotate", {
        method: 'POST',
        body: formData,
        headers: {
        'X-CSRFToken': csrftoken
        }
    }).then(function (reponse) {
        hideProcessingScreen();
        // downloadPolyDataAndUpdate(objID);
    });
    objects[objID].actor.rotateX (x*57.2958);
    objects[objID].actor.rotateY (y*57.2958);
    objects[objID].actor.rotateZ (z*57.2958);
    refreshVTK();
}


function translate(objID, x, y, z) {
    // Add the data
    showProcessingScreen();
    var formData  = new FormData();
    formData.append("x", String(x));
    formData.append("y", String(y));
    formData.append("z", String(z));

    formData.append("objID", objID);
    formData.append("session", session_id);

    // Submit the request to rotate
    fetch("process/align/translate", {
        method: 'POST',
        body: formData,
        headers: {
        'X-CSRFToken': csrftoken
        }
    }).then(function (reponse) {
        hideProcessingScreen();
        // downloadPolyDataAndUpdate(objID);
    });
    objects[objID].actor.addPosition ([x, y, z]);
    refreshVTK();
}

function createIncrementButton(text, parentNode, callback, tooltipValue, classType) {
    const buttonContainer = document.createElement("div");
    buttonContainer.setAttribute("class", "buttonContainer");
    buttonContainer.style.display = "inline";
    if (tooltipValue !== undefined) {
        // Add tooltip
        const tooltip = document.createElement("span");
        tooltip.setAttribute("class", "tooltiptext");
        tooltip.innerHTML = tooltipValue;
        buttonContainer.appendChild(tooltip);
    }

    // Add + button
    let rotate_button = document.createElement('BUTTON');
    rotate_button.setAttribute("class", classType);
    rotate_button.innerHTML = text;
    buttonContainer.appendChild(rotate_button);
    rotate_button.addEventListener('click', callback);

    parentNode.appendChild(buttonContainer);
}

function getTranslationSpeed() {
    if (document.getElementById("adjustPrecision").checked) {
        return 0.5;
    } else {
        return 5;
    }
}
function getRotationSpeed() {
    // Convert to radians
    if (document.getElementById("adjustPrecision").checked) {
        return 0.5 *  0.0174533;
    } else {
        return 5 *  0.0174533;
    }
}

function addAlignButtons() {

    const containerTransform = document.getElementById('transformationContainer');
    const axis = {"X": [1, 0, 0], "Y": [0, 1, 0], "Z":[0, 0, 1]};

    const rotationAxisContainer = document.createElement("div");
    rotationAxisContainer.setAttribute("class", "axisTransformContainerTranslation");
    const labelContainer = document.createElement("div");
    labelContainer.innerHTML = "Rotate";
    rotationAxisContainer.appendChild(labelContainer);
    containerTransform.appendChild(rotationAxisContainer);


    const translationAxisContainer = document.createElement("div");
    const labelContainer2 = document.createElement("div");
    labelContainer2.innerHTML = "Translate";
    translationAxisContainer.appendChild(labelContainer2);
    translationAxisContainer.setAttribute("class", "axisTransformContainerRotation");
    containerTransform.appendChild(translationAxisContainer);


    // Add alignment buttons
    for (const a in axis) {

        // Add rotation controls for rotations
        const axisContainerRotation = document.createElement("div");
        axisContainerRotation.setAttribute("class", "axisContainer");
        axisContainerRotation.innerHTML = a.concat(": ");
        rotationAxisContainer.appendChild(axisContainerRotation);

        createIncrementButton("+", axisContainerRotation, function(){
            let rotationSpeed = getRotationSpeed();
            rotate(getAlignMoving(), axis[a][0]*rotationSpeed, axis[a][1]*rotationSpeed, axis[a][2]*rotationSpeed);
        }, "Manually adjust rotation up", "axisIncrementButton");

        createIncrementButton("-", axisContainerRotation, function(){
            let rotationSpeed = getRotationSpeed();
            rotate(getAlignMoving(), -axis[a][0]*rotationSpeed, -axis[a][1]*rotationSpeed, -axis[a][2]*rotationSpeed);
        }, "Manually adjust rotation down", "axisIncrementButton");


        // Add rotation controls for translations
        const axisContainerTranslation = document.createElement("div");
        axisContainerTranslation.setAttribute("class", "axisContainer");
        axisContainerTranslation.innerHTML = a.concat(": ");
        translationAxisContainer.appendChild(axisContainerTranslation);

        createIncrementButton("+", axisContainerTranslation, function(){
            let translationSpeed = getTranslationSpeed();
            translate(getAlignMoving(), axis[a][0]*translationSpeed, axis[a][1]*translationSpeed, axis[a][2]*translationSpeed);
        }, "Manually adjust translation up", "axisIncrementButton");

        createIncrementButton("-", axisContainerTranslation, function(){
            let translationSpeed = getTranslationSpeed();
            translate(getAlignMoving(), -axis[a][0]*translationSpeed, -axis[a][1]*translationSpeed, -axis[a][2]*translationSpeed);
        }, "Manually adjust translation down", "axisIncrementButton");
    }
}

function updateAlignButtons () {
    const buttons = document.getElementsByClassName("axisIncrementButton");
    for (const i in buttons) {
        // Set buttons to disabled if align moving is not selected yet
        if (getAlignMoving() === "") {
            buttons[i].disabled = true;
            document.getElementById("runCentreButton").disabled = true;
            document.getElementById("runCentreRelativeButton").disabled = true;
        } else {
            buttons[i].disabled = false;
            document.getElementById("runCentreButton").disabled = false;
            document.getElementById("runCentreRelativeButton").disabled = false;
        }
    }

    // Disable icp button if both static and moving targets aren't selected or the same is selected
    if (getAlignMoving() !== "" && getAlignStatic() !== "" && getAlignStatic() !== getAlignMoving()) {
        document.getElementById("runICPButton").disabled = false;
        document.getElementById("goToRegistrationButton").disabled = false;
    } else {
        document.getElementById("runICPButton").disabled = true;
        document.getElementById("goToRegistrationButton").disabled = true;
    }

    // Disable center button if no moving is selected
}



function updateAlign() {
    for (const i in objects) {
        if (objects[i].name === getAlignMoving()) {
            objects[i].actor.setVisibility(true);
            if (alignMovingColour != null) {
                objects[i].changeColourTemp(document.getElementById("alignMovingColour").value);
                objects[i].changeOpacityTemp(document.getElementById("alignMovingOpacity").value);
            }
        } else if (objects[i].name === getAlignStatic()){
            objects[i].actor.setVisibility(true);
            if (alignStaticColour != null) {
                objects[i].changeColourTemp(document.getElementById("alignStaticColour").value);
                objects[i].changeOpacityTemp(document.getElementById("alignStaticOpacity").value);
            }
        } else {
            objects[i].actor.setVisibility(false);
        }
    }
    refreshVTK();

    updateAlignButtons ();
}
