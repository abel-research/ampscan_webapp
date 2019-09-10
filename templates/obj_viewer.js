
document.documentElement.style.setProperty("--rowHeight", window.outerHeight/2);

class AmpObjectContainer {
    constructor(name, display, type, colour=[1, 1, 1], opacity=1) {
        this.name = name;
        this.display = display;
        this.type = type;
        this.colour = colour;
        this.opacity = opacity;

        this.polydata = null;
        this.checkbox = null;
        this.actor = null;
        // Note actor is set during polyUpdate
    }

    setActorVisibility(display) {
        this.actor.setVisibility(display);
        this.display = display;
        if (this.checkbox != null)
            this.checkbox.checked = display;
        refreshVTK();
    }

    resetVisibility() {
        this.setActorVisibility(this.display);
    }

    toggleDisplay() {
        let display = this.checkbox.checked;

        this.display = display;
        this.setActorVisibility(display);
    }

    addDisplayCheckbox(checkbox) {
        var ob = this;
        this.checkbox = checkbox;
        checkbox.addEventListener("change", function(){ob.toggleDisplay()});
    }

    setActor(actor) {
        this.actor = actor;
    }

    resetColour() {
        this.setActorColour(this.colour[0], this.colour[1], this.colour[2]);
    }

    setActorColour(r, g, b) {
        this.actor.getProperty().setColor(r, g, b);
        refreshVTK();
    }

    changeColourTemp(colour) {
        console.log(this.actor.getProperty().getColor());
        // colour come in as hex e.g. #ff92aa
        const r = parseInt(colour.substr(1, 2), 16) / 255;
        const g = parseInt(colour.substr(3, 2), 16) / 255;
        const b = parseInt(colour.substr(5, 2), 16) / 255;
        this.setActorColour(r, g, b)
    }

    resetOpacity() {
        this.setActorOpacity(this.opacity);
    }

    setActorOpacity(opacity) {
        this.actor.getProperty().setOpacity(opacity);
        refreshVTK();
    }

    changeOpacityTemp(opacity) {
        // Opacity come in as 0-100
        this.setActorOpacity(opacity/100)
    }

    resetVis() {
        // Call to reset to defaults
        this.resetOpacity();
        this.resetColour();
        this.resetVisibility();
    }
}

function hideAllObjects() {
    for (objID in objects) {
        objects[objID].setActorVisibility(false);
    }
}

function removeObject(objID) {
    for (var renderObject of Object.values(renderers)) {
        renderObject["renderer"].removeActor(objects[objID].actor);
    }
    if (!(delete objects[objID])) {
        alert("Object doesn't exist: " + objID);
    }
    updateObjectTable();
    refreshVTK();

    // Remove from server
    const formData = new FormData();
    formData.append("session", session_id);
    formData.append("objID", objID);

    fetch("process/remove", {
        method: 'POST',
        body: formData,
        headers: {
        'X-CSRFToken': csrftoken
        }
    })
}

const objects = {};


// Get session id
const session_id = {{ session_id }}

// ----------------------------------------------------------------------------
// Setup renderers
// ----------------------------------------------------------------------------
const renderers = {};

// Create renderer and add to list of renderers
function addRenderer(name, parentNode, interactive=false) {
    const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    const renderer = vtk.Rendering.Core.vtkRenderer.newInstance({ background: [0.95, 0.95, 0.95] });
    renderWindow.addRenderer(renderer);

    const openglRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    renderWindow.addView(openglRenderWindow);

    const container = parentNode;
    openglRenderWindow.setContainer(container);

    let interactor;
    if (interactive) {
        // Add interactor to main renderer
        interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
        interactor.setView(openglRenderWindow);
        interactor.initialize();
        interactor.bindEvents(container);
        interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleTrackballCamera.newInstance());
    }

    renderers[name] = {"renderer":renderer, "container":container, "openglRenderWindow":openglRenderWindow, "interactor": interactor};
}


function showAlignViews() {
    const alignViews = document.getElementsByClassName("alignViewContainer");
    for (let view of alignViews) {
        view.style.display = "block";
    }
    document.getElementById("mainViewer").style.display = "none";
    updateWindowSize();
}
function showMain() {
    const alignViews = document.getElementsByClassName("alignViewContainer");
    for (let view of alignViews) {
        view.style.display = "none";
    }
    document.getElementById("mainViewer").style.display = "block";
    updateWindowSize();
}

// Add renderers
addRenderer("primaryRenderer", document.getElementById('mainViewer'), true);
addRenderer("rendererTopRight", document.getElementById('topRightViewer'));
addRenderer("rendererTopLeft", document.getElementById('topLeftViewer'), true);
addRenderer("rendererBottomRight", document.getElementById('bottomRightViewer'));
addRenderer("rendererBottomLeft", document.getElementById('bottomLeftViewer'));

// Set camera directions
renderers["rendererTopRight"]["renderer"].getActiveCamera().setDirectionOfProjection(0, 0, 1);
renderers["rendererTopLeft"]["renderer"].getActiveCamera().setDirectionOfProjection(1, 1, 1);
renderers["rendererBottomRight"]["renderer"].getActiveCamera().setDirectionOfProjection(0, 1, 0);
renderers["rendererBottomLeft"]["renderer"].getActiveCamera().setDirectionOfProjection(1, 0, 0);


// Static cameras use parallel projection
renderers["rendererTopRight"]["renderer"].getActiveCamera().setParallelProjection(true);
renderers["rendererBottomRight"]["renderer"].getActiveCamera().setParallelProjection(true);
renderers["rendererBottomLeft"]["renderer"].getActiveCamera().setParallelProjection(true);


showMain();

function updateWindowSize() {
    // Update window size when window size changes
    for (var renderObject of Object.values(renderers)) {
        const {width, height} = renderObject["container"].getBoundingClientRect();
        renderObject["openglRenderWindow"].setSize(width, height);
        renderObject["renderer"].getRenderWindow().render();
    }
    updateScalarHeight();
}

window.addEventListener("resize", updateWindowSize);
updateWindowSize();

// ----------------------------------------------------------------------------
// Add scans
// ----------------------------------------------------------------------------
var rolled = false;
function resetCamera() {
    for (var renderObject of Object.values(renderers)) {
        renderObject["renderer"].resetCamera();
    }
    renderers["rendererTopRight"]["renderer"].getActiveCamera().zoom(1.5);
    renderers["rendererTopLeft"]["renderer"].getActiveCamera().dolly(1);
    renderers["rendererBottomRight"]["renderer"].getActiveCamera().zoom(1);
    renderers["rendererBottomLeft"]["renderer"].getActiveCamera().zoom(1);

    // Make all limbs vertical
    if (!rolled) {
        renderers["rendererBottomLeft"]["renderer"].getActiveCamera().roll(90);
        rolled = true;
    }

    for (var renderObject2 of Object.values(renderers)) {
        renderObject2["renderer"].resetCameraClippingRange();
        renderObject2["renderer"].getRenderWindow().render();
    }

    updateSlices();
}

function sliceToggle() {
    resetCamera();
}

function updateSlices() {
    // If slicing is enabled
    if (document.getElementById("sliceToggle").checked) {
        let displacement = document.getElementById("sliceDistanceSlider").value/1;
        clippedCamera = renderers["rendererTopRight"]["renderer"].getActiveCamera();
        clippedCamera.setClippingRange(clippedCamera.getDistance()+displacement, clippedCamera.getDistance()+displacement + 5);
        renderers["rendererTopRight"]["renderer"].getRenderWindow().render();
    }
}

/**
 * Creates the scalar bar dynamically based on the number of colours
 *
 * @param lut the lookup table used by the mapper for the registration objects
 *
 * @param container The div container for this to be placed in
 */
function createScalarBar(lut, container) {
    const table = lut.getTable();

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    let rgba1 = [];
    let legendDiv = container;
    var newSpan = document.createElement("span");
    newSpan.classList.add("key");
    document.getElementById("keyLabel").innerHTML = "Shape Deviation /mm";
    legendDiv.appendChild(newSpan);
    var ul = document.createElement("div");
    ul.style.setProperty("list-style", "none");
    legendDiv.appendChild(ul);
    for (let i = table.length/4-4; i >= 0; i--) {
        var newli = document.createElement("div");
        rgba1[0] = table[i*4];
        rgba1[1] = table[i*4 + 1];
        rgba1[2] = table[i*4 + 2];
        rgba1[3] = table[i*4 + 3];
        newli.style.backgroundColor = "rgb(" + rgba1 + ")";
        newli.classList.add("colourLegend");
        ul.appendChild(newli);
    }
    updateScalarHeight(lut);

    // createTicks(4, 0, 80, Nocolours);
}

function updateScalarHeight(lut) {
    if (lut !== undefined) {
        document.documentElement.style.setProperty(
            '--legendColourRowHeight',
            (window.outerHeight - 60 * 2) / (lut.getTable().length / 4) + 'px');
    }
    else if (lookupTable !== undefined) {
        document.documentElement.style.setProperty(
            '--legendColourRowHeight',
            (window.outerHeight - 60 * 2) / (lookupTable.getTable().length / 4) + 'px');
    }
}


function createLUT() {
    const lookupTable = window.vtkNewLookupTable.newInstance();
    const numColors = 40;
    lookupTable.setNumberOfColors(numColors);
    lookupTable.build();
    createScalarBar(lookupTable, document.getElementById("legend"));
    return lookupTable
}

var lookupTable;

function updateObject(polyData, objID) {
    // objID is the name of the object being updated

    lookupTable = createLUT();

    var mapper = vtk.Rendering.Core.vtkMapper.newInstance({
        interpolateScalarsBeforeMapping: true,
        useLookupTableScalarRange: false,
        lookupTable: lookupTable,
        scalarVisibility: true });
    var actor = vtk.Rendering.Core.vtkActor.newInstance();

    actor.setMapper(mapper);
    mapper.setInputData(polyData);

    function addActor() {
        // Remove any previous actors for this object
        let prevActor = objects[objID].actor;


        for (var renderObject of Object.values(renderers)) {
            renderObject["renderer"].addActor(actor);
        }
        if (prevActor != null)
            for (var renderObject of Object.values(renderers)) {
                renderObject["renderer"].removeActor(prevActor);
            }
        else {
            resetCamera();
        }
        for (var renderObject of Object.values(renderers)) {
            renderObject["renderer"].getRenderWindow().render();
        }
        objects[objID].setActor(actor);
        objects[objID].resetVisibility()
    }
    addActor();

    return actor;
}

function refreshVTK() {
    for (var renderObject of Object.values(renderers)) {
        renderObject["renderer"].getRenderWindow().render(); // Rerender
    }
}

function downloadPolyDataAndUpdate(objID, callback) {
    polyData = vtk.Common.DataModel.vtkPolyData.newInstance();

    const formData = new FormData();
    formData.append("norms", isNormsSelected());
    formData.append("session", session_id);
    formData.append("objID", objID);

    fetch("download/polydata", {
        method: 'POST',
        body: formData,
        headers: {
        'X-CSRFToken': csrftoken
        }
    })
    .then(function(response) {
        // Convert reponse to json
        return response.json();
    })
    .then(function(jsonResponse) {
        polyData.getPoints().setData(jsonResponse["verts"], 3);
        polyData.getPolys().setData(jsonResponse["faces"]);

        // If norms enabled
        if (jsonResponse.hasOwnProperty("norm")){
            const vtkNorm = vtk.Common.Core.vtkDataArray.newInstance({
                numberOfComponents: 1,
                values: jsonResponse["norm"]
            });
            polyData.getPointData().setNormals(vtkNorm);
        }

        updateObject(polyData, objID);
        updateObjectTable();
        updateDropdown();

        // Apply scalars to object
        if (jsonResponse.hasOwnProperty("scalars")) {
            let mn=1000000, mx=-1000000;
            // Find the min and max for scalar range
            for (i in jsonResponse["scalars"]) {
                if (!isNaN(jsonResponse["scalars"][i])) {
                    mn = Math.min(jsonResponse["scalars"][i], mn);
                    mx = Math.max(jsonResponse["scalars"][i], mx);
                }
            }
            objects[objID].actor.getMapper().setScalarRange(mn, mx);
            const vtScalar = vtk.Common.Core.vtkDataArray.newInstance({
                numberOfComponents: 1,
                values: jsonResponse["scalars"],
            });
            polyData.getPointData().setScalars(vtScalar);
            refreshVTK();
        }

        objects[objID].polydata = polyData;

        // Execute callback once finished loading object
        if (typeof callback !== 'undefined')
            callback();
    });
    return polyData;
}

function hideObject(objID) {
    objects[objID].display = false;
    objects[objID].actor.setVisibility(false);
}


// ----------------------------------------------------------------------------
// Get CSRF token for POST requests
// ----------------------------------------------------------------------------

function getCookie(name) {
    // From Django docs
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

// ----------------------------------------------------------------------------
// Setup Home panel
// ----------------------------------------------------------------------------
const containerHome = document.getElementById('Home');

// Add upload button
var uploadInput = document.createElement("INPUT");
uploadInput.setAttribute("accept", ".stl");
uploadInput.setAttribute("type", "file");
// uploadInput.style.display = "none";
// containerHome.insertBefore(uploadInput, document.getElementById("resetCameraContainer"));


const uploadButton = document.createElement("BUTTON");
uploadButton.innerHTML = "Upload Scan";
uploadButton.addEventListener('click', function (){uploadInput.click();});
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
    .then(function(response) {
        // Convert response to json
        return response.json();
    })
    .then(function(jsonResponse) {
        objects[jsonResponse["objID"]] =
            new AmpObjectContainer(jsonResponse["objID"], jsonResponse["properties"]["display"], jsonResponse["properties"]["type"]);
        downloadPolyDataAndUpdate(jsonResponse["objID"]);
        uploadInput.value = null;
    });
}, false);





// ----------------------------------------------------------------------------
// Setup Align panel
// ----------------------------------------------------------------------------

function getAlignMoving() {
    const dropdown = document.getElementById("alignMovingDropdown");
    if (dropdown.selectedIndex !== -1)
        return dropdown.options[dropdown.selectedIndex].text;
    else
        return "";
}
function setAlignMoving(objID) {
    const dropdown = document.getElementById("alignMovingDropdown");
    options = dropdown.options;
    for (i = 0; i < options.length; i ++) {
        if (options[i].value === objID) {
            dropdown.selectedIndex = i;
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

function resetAlignDropDowns() {
    // Set moving and static to be blank
    const dropdown1 = document.getElementById("alignMovingDropdown");
    dropdown1.selectedIndex = -1;
    const dropdown2 = document.getElementById("alignStaticDropdown");
    dropdown2.selectedIndex = -1
}


function runICP() {
    const formData = new FormData();

    formData.append("session", session_id);
    formData.append("movingID", getAlignMoving());
    formData.append("staticID", getAlignStatic());

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
        objects[jsonResponse["newObjID"]] = new AmpObjectContainer(jsonResponse["newObjID"], true, "align");
        downloadPolyDataAndUpdate(jsonResponse["newObjID"], function() {
            // Change the moving object to the new object
            setAlignMoving(jsonResponse["newObjID"]);
            updateAlign();
        });
    })
}



function runCentre(global) {
    const formData = new FormData();

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
        });
    })
}

function rotate(objID, x, y, z) {
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
        // downloadPolyDataAndUpdate(objID);
    });
    objects[objID].actor.rotateX (x*57.2958);
    objects[objID].actor.rotateY (y*57.2958);
    objects[objID].actor.rotateZ (z*57.2958);
    refreshVTK();
}


function translate(objID, x, y, z) {
    // Add the data
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
        // downloadPolyDataAndUpdate(objID);
    });
    objects[objID].actor.addPosition ([x, y, z]);
    refreshVTK();
}

const containerTransform = document.getElementById('transformationContainer');
const axis = {"X": [1, 0, 0], "Y": [0, 1, 0], "Z":[0, 0, 1]};
const rotationSpeed = 0.1;
const translationSpeed = 1;

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
        rotate(getAlignMoving(), axis[a][0]*rotationSpeed, axis[a][1]*rotationSpeed, axis[a][2]*rotationSpeed);
    }, "Manually adjust rotation up", "axisIncrementButton");

    createIncrementButton("-", axisContainerRotation, function(){
        rotate(getAlignMoving(), -axis[a][0]*rotationSpeed, -axis[a][1]*rotationSpeed, -axis[a][2]*rotationSpeed);
    }, "Manually adjust rotation down", "axisIncrementButton");


    // Add rotation controls for translations
    const axisContainerTranslation = document.createElement("div");
    axisContainerTranslation.setAttribute("class", "axisContainer");
    axisContainerTranslation.innerHTML = a.concat(": ");
    translationAxisContainer.appendChild(axisContainerTranslation);

    createIncrementButton("+", axisContainerTranslation, function(){
        translate(getAlignMoving(), axis[a][0]*translationSpeed, axis[a][1]*translationSpeed, axis[a][2]*translationSpeed);
    }, "Manually adjust translation up", "axisIncrementButton");

    createIncrementButton("-", axisContainerTranslation, function(){
        translate(getAlignMoving(), -axis[a][0]*translationSpeed, -axis[a][1]*translationSpeed, -axis[a][2]*translationSpeed);
    }, "Manually adjust translation down", "axisIncrementButton");
}

function updateAlignButtons () {
    const buttons = document.getElementsByClassName("axisIncrementButton");
    for (const i in buttons) {
        // Set buttons to disabled if align moving is not selected yet
        if (getAlignMoving() === "") {
            buttons[i].disabled = true;
            document.getElementById("runCentreButton").disabled = true;
        } else {
            buttons[i].disabled = false;
            document.getElementById("runCentreButton").disabled = false;
        }
    }

    // Disable icp button if both static and moving targets aren't selected or the same is selected
    if (getAlignMoving() !== "" && getAlignStatic() !== "" && getAlignStatic() !== getAlignMoving()) {
        document.getElementById("runICPButton").disabled = false;
    } else {
        document.getElementById("runICPButton").disabled = true;
    }

    // Disable center button if no moving is selected
}

// ----------------------------------------------------------------------------
// Setup object panel
// ----------------------------------------------------------------------------

function hideOverflowMenus() {
    const menus = document.getElementsByClassName("overflowMenu");
    for (m in menus) {
        if (menus[m].style !== undefined)
            menus[m].style.display = "none";
    }
}

document.getElementById("wrapper").addEventListener("click", function() {
    hideOverflowMenus();
});

function updateObjectTable() {
    var lastClicked = null;
    const objectTable = document.getElementById("objTable");

    // Clear table
    for(var i = objectTable.rows.length - 1; i > 0; i--) {
        objectTable.deleteRow(i);
    }


    // Create overflow menu
    const overflowMenu = document.createElement("div");

    overflowMenu.setAttribute("class", "overflowMenu");
    const saveButton = document.createElement("BUTTON");
    saveButton.innerHTML = "Save";

    const removeButton = document.createElement("BUTTON");
    removeButton.innerHTML = "Remove";
    removeButton.addEventListener("click", function() {
        removeObject(selectedObjID);
    })

    // Make save button call save on object
    var selectedObjID = null;
    saveButton.addEventListener("click", function() {
        saveObject(selectedObjID)
    });

    overflowMenu.appendChild(saveButton);
    overflowMenu.appendChild(removeButton);

    document.getElementById("obj-manager").appendChild(overflowMenu);


    // Create table from data received
    for (objID in objects){
        var row = objectTable.insertRow(-1);

        row.setAttribute("class", "objectTableRow");

        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);

        // Add checkbox to display cell
        var showCheckbox = document.createElement("INPUT"); //Added for checkbox
        showCheckbox.type = "checkbox"; //Added for checkbox
        showCheckbox.checked = objects[objID].display;
        showCheckbox.id = objID.concat(" dropdown");
        objects[objID].addDisplayCheckbox(showCheckbox);

        // Add overflow button to end of row
        const overflowButton = document.createElement("BUTTON");
        const overflowContainer = document.createElement("div");
        overflowContainer.appendChild(overflowButton);
        overflowContainer.setAttribute("class", "overflowContainer");

        overflowButton.setAttribute("class", "objectOverflowButton");
        overflowButton.setAttribute("id", "objectOverflowButton".concat(objID));
        // overflowButton.innerHTML = "..."
        overflowButton.addEventListener("click", function(event) {

            // Remove objectOverflowButton tag from from
            selectedObjID = event.target.id.substring(20);

            // Create overflow menu
            // const overflowMenu = document.getElementById("overflowMenu");

            // Logic to set location and visibility of overflow menu
            if (lastClicked == null) {
                overflowMenu.style.display = "block";
                lastClicked = event.target.parentElement.id;
                event.target.parentElement.parentElement.appendChild(overflowMenu);
            } else if (lastClicked === event.target.id){
                if (overflowMenu.style.display === "block")
                    overflowMenu.style.display = "none";
                else
                    overflowMenu.style.display = "block";
            } else {
                overflowMenu.style.display = "block";
                lastClicked = event.target.id;
                event.target.parentElement.parentElement.appendChild(overflowMenu);
            }
            // Stops overflow from being hidden by click elsewhere on screen
            event.stopPropagation();
        });

        cell1.setAttribute("class", "objectTableCell");
        cell2.setAttribute("class", "objectTableCell");
        cell3.setAttribute("class", "objectTableCell");
        cell4.setAttribute("class", "overflowMenuCell");

        cell1.innerHTML = objects[objID].name;
        cell2.appendChild(showCheckbox);
        cell3.innerHTML = objects[objID].type;
        cell4.appendChild(overflowContainer);
    }
}

updateObjectTable();

// ----------------------------------------------------------------------------
// Setup settings panel
// ----------------------------------------------------------------------------

// Default to checked
selectNorms(true);

function normsChange() {
    // When the tickbox is change, updateObject the stl
    for (i in objects) {
        downloadPolyDataAndUpdate(i);
    }

}

function isNormsSelected() {
    var tickBox = document.getElementById("normsTickbox");
    return tickBox.checked;
}

function selectNorms(val) {
    var tickBox = document.getElementById("normsTickbox");
    tickBox.checked = val
}

// ----------------------------------------------------------------------------
// Setup tabbing
// ----------------------------------------------------------------------------


currentTab = "Home";
document.getElementById("defaultTabOpen").click();

function getCurrentTab() {
    return currentTab;
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Each time a new tab is opened hide the overflow menus
    hideOverflowMenus();

    // If the old tab was "Align" then reveal all objects again
    if ((getCurrentTab() === "Align" && tabName !== "Align") || (getCurrentTab() === "Register" && tabName !== "Register")) {
        revealAllObjectsDisplayed();
        // Show obj manager
        document.getElementById("obj-manager").style.display = "block";
        showMain();
    }

    currentTab = tabName;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.className += " active";

    // If new tab is "Align" then only show aligning objects
    if (getCurrentTab() === "Align") {
        showAlignViews();
        updateAlign();
        // Hide obj manager
        document.getElementById("obj-manager").style.display = "none";
    }
    if (getCurrentTab() === "Register") {
        updateRegistration();
        // Hide obj manager
        document.getElementById("obj-manager").style.display = "none";
    }
}

// ----------------------------------------------------------------------------
// Setup Align and drop downs
// ----------------------------------------------------------------------------

function updateAlign() {
    for (i in objects) {
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
function revealAllObjectsDisplayed() {
    for (i in objects) {
        objects[i].resetVis();
    }
    refreshVTK();
}

function updateDropdown() {
    let dropdowns = document.getElementsByClassName('targetDropdown');
    for (dd=0; dd<dropdowns.length; dd++) {
        let dropdown = dropdowns[dd];
        let si = dropdown.selectedIndex;
        dropdown.options.length = 0;
        for (i in objects) {
            dropdown.options[dropdown.options.length] = new Option(objects[i].name, i);
        }
        dropdown.selectedIndex = si;
    }

    if (getCurrentTab() === "Align") {
        updateAlign();
    }

    if (getCurrentTab() === "Register") {
        updateRegistration();
    }
}
updateDropdown();

// Set up colour picker inputs
document.getElementById("alignStaticColour").addEventListener("input", function(event) {
    const newColour = event.target.value;
    if (getAlignStatic() !== "") {
        objects[getAlignStatic()].changeColourTemp(newColour);
    }
});


document.getElementById("alignMovingColour").addEventListener("input", function(event) {
    const newColour = event.target.value;
    if (getAlignMoving() !== "") {
        objects[getAlignMoving()].changeColourTemp(newColour);
    }
});

// Set up opacity sliders
document.getElementById("alignStaticOpacity").addEventListener("input", function(event) {
    const newOpacity = event.target.value;
    if (getAlignStatic() !== "") {
        objects[getAlignStatic()].changeOpacityTemp(newOpacity);
    }
});

document.getElementById("alignMovingOpacity").addEventListener("input", function(event) {
    const newOpacity = event.target.value;
    if (getAlignMoving() !== "") {
        objects[getAlignMoving()].changeOpacityTemp(newOpacity);
    }
});



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
        objects[jsonResponse["newObjID"]] = new AmpObjectContainer(jsonResponse["newObjID"], true, "reg");
        downloadPolyDataAndUpdate(jsonResponse["newObjID"], function() {
            openTab(document.getElementById("defaultTabOpen"), "Home");
            hideAllObjects();
            objects[jsonResponse["newObjID"]].setActorVisibility(true);
        });
        resetRegistrationDropDowns();
    })
}

// ----------------------------------------------------------------------------
// Save object
// ---------------------------------------------------------------------------

function saveObject(objID) {
    const formData = new FormData();

    formData.append("session", session_id);
    formData.append("objID", objID);

    fetch('download/stl_file', {
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
        a.download = objID+'.stl';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('File download failed'));
}