tempID = "stl_file";


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

const objects = {};


// Get session id
const session_id = {{ session_id }}

// ----------------------------------------------------------------------------
// Setup renderer
// ----------------------------------------------------------------------------
const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
const renderer = vtk.Rendering.Core.vtkRenderer.newInstance({ background: [0.9, 0.9, 0.9] });
renderWindow.addRenderer(renderer);

const openglRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
renderWindow.addView(openglRenderWindow);

const container2 = document.getElementById('viewer');
openglRenderWindow.setContainer(container2);

const interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(container2);
interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleTrackballCamera.newInstance());

function updateWindowSize() {
    // Update window size when window size changes
    const { width, height } = container2.getBoundingClientRect();
    openglRenderWindow.setSize(width, height);//+10 for no gap
    renderWindow.render();
}

window.addEventListener("resize", updateWindowSize);
updateWindowSize();

// ----------------------------------------------------------------------------
// Add scans
// ----------------------------------------------------------------------------

function updateObject(polyData, objID) {
    // objID is the name of the object being updated
    var mapper = vtk.Rendering.Core.vtkMapper.newInstance({ scalarVisibility: true });
    var actor = vtk.Rendering.Core.vtkActor.newInstance();

    actor.setMapper(mapper);
    mapper.setInputData(polyData);

    function addActor() {
        // Remove any previous actors for this object
        let prevActor = objects[objID].actor;

        renderer.addActor(actor);
        if (prevActor != null)
            renderer.removeActor(prevActor);
        else {
            renderer.resetCamera();
        }
        renderer.getRenderWindow().render();
        objects[objID].setActor(actor);
    }
    addActor();

    return actor;
}

function refreshVTK() {
    renderer.getRenderWindow().render(); // Rerender
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
        },
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
            })
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
// const upload_button = document.createElement('BUTTON');
// upload_button.innerHTML = 'Show';
// containerHome.appendChild(upload_button);
// upload_button.addEventListener('click', polyProcess);

// Add upload button
var upload_button = document.createElement("INPUT");
upload_button.setAttribute("accept", ".stl");
upload_button.setAttribute("type", "file");
containerHome.appendChild(upload_button);
upload_button.addEventListener('change', e => {
    // Get the file from the upload button
    const files = upload_button.files;
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
        'X-CSRFToken': csrftoken
        },
    })
    .then(function(response) {
        // Convert response to json
        return response.json();
    })
    .then(function(jsonResponse) {
        objects[jsonResponse["objID"]] =
            new AmpObjectContainer(jsonResponse["objID"], jsonResponse["properties"]["display"], jsonResponse["properties"]["type"]);
        downloadPolyDataAndUpdate(jsonResponse["objID"]);
    });
});

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
    const dropdown = document.getElementById("alignStaticDropdown");;
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
        },
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
        },
    }).then(function (reponse) {
        downloadPolyDataAndUpdate(objID);
    })
}

const containerRotate = document.getElementById('rotationContainer');

// Add rotate button
const rotate_button = document.createElement('BUTTON');
rotate_button.innerHTML = 'Rotate';
containerRotate.appendChild(rotate_button);
rotate_button.addEventListener('click', function(){ rotate(getAlignMoving(), 0.1, 0, 0); });

// Add rotate2 button
const rotate2_button = document.createElement('BUTTON');
rotate2_button.innerHTML = 'Rotate Back';
containerRotate.appendChild(rotate2_button);
rotate2_button.addEventListener('click', function(){ rotate(getAlignMoving(), -0.1, 0, 0); });

// ----------------------------------------------------------------------------
// Setup object panel
// ----------------------------------------------------------------------------

function updateObjectTable() {
    const objectTable = document.getElementById("objTable");

    // Clear table
    for(var i = objectTable.rows.length - 1; i > 0; i--) {
        objectTable.deleteRow(i);
    }

    // Create table from data received
    for (objID in objects){
        var row = objectTable.insertRow(-1);

        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);

        // Add checkbox to display cell
        var showCheckbox = document.createElement("INPUT"); //Added for checkbox
        showCheckbox.type = "checkbox"; //Added for checkbox
        showCheckbox.checked = objects[objID].display;
        showCheckbox.id = objID.concat(" dropdown");
        objects[objID].addDisplayCheckbox(showCheckbox);

        cell1.innerHTML = objects[objID].name;
        cell2.appendChild(showCheckbox);
        cell3.innerHTML = objects[objID].type;
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

    // If the old tab was "Align" then reveal all objects again
    if (getCurrentTab() === "Align" && tabName !== "Align") {
        revealAllObjectsDisplayed();
        // Show obj manager
        document.getElementById("obj-manager").style.display = "block";
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
    evt.currentTarget.className += " active";

    // If new tab is "Align" then only show aligning objects
    if (getCurrentTab() === "Align") {
        resetAlignDropDowns();
        updateAlign();
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

    // Disable icp button if both static and moving targets aren't selected or the same is selected
    if (getAlignMoving() !== "" && getAlignStatic() !== "" && getAlignStatic() !== getAlignMoving()) {
        document.getElementById("runICPButton").disabled = false;
    } else {
        document.getElementById("runICPButton").disabled = true;
    }
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
    return dropdown.options[dropdown.selectedIndex].text;
}
function getRegistrationBaseline() {
    const dropdown = document.getElementById("registerBaselineDropdown");
    return dropdown.options[dropdown.selectedIndex].text;
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
        },
    })
    .then(function(response) {
        // Convert response to json
        return response.json();
    })
    .then(function (jsonResponse) {
        objects[jsonResponse["newObjID"]] = new AmpObjectContainer(jsonResponse["newObjID"], true, "reg");
        downloadPolyDataAndUpdate(jsonResponse["newObjID"]);
    })
}
