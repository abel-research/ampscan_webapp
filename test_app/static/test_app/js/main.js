
document.documentElement.style.setProperty("--rowHeight", window.outerHeight/2);

/**
 * Hides all the object actors
 */
function hideAllObjects() {
    for (objID in objects) {
        objects[objID].setActorVisibility(false);
    }
}

/**
 * Removes an object from the object table and makes a server call to remove object from server
 * @param objID
 */
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

    // If a item is removed, update analyse
    if (getCurrentTab() === "Analyse") {
        updateAnalyse();
    }
}

const objects = {};


// Get session id
let session_id;

function setSessionID(id) {
    session_id = id;
}

// ----------------------------------------------------------------------------
// Setup renderers
// ----------------------------------------------------------------------------
const renderers = {};

/**
 * Create renderer and add to list of global renderers
 */
function addRenderer(name, parentNode, interactive=false, bg=[0.97, 0.97, 0.97]) {
    const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    const renderer = vtk.Rendering.Core.vtkRenderer.newInstance({ background: bg });
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

/**
 * Show the alignment render views
 */
function showAlignViews() {
    const alignViews = document.getElementsByClassName("alignViewContainer");
    for (let view of alignViews) {
        view.style.display = "block";
    }
    const analyseViews = document.getElementsByClassName("analyseViewContainer");
    for (let view of analyseViews) {
        view.style.display = "none";
    }
    document.getElementById("mainViewer").style.display = "none";
    updateWindowSize();
}

/**
 * Show the main render view
 */
function showMainView() {
    const alignViews = document.getElementsByClassName("alignViewContainer");
    for (let view of alignViews) {
        view.style.display = "none";
    }
    const analyseViews = document.getElementsByClassName("analyseViewContainer");
    for (let view of analyseViews) {
        view.style.display = "none";
    }
    document.getElementById("mainViewer").style.display = "block";
    updateWindowSize();
}

/**
 * Show the alingment render view
 */
function showAnalyseViews() {
    const alignViews = document.getElementsByClassName("alignViewContainer");
    for (let view of alignViews) {
        view.style.display = "none";
    }
    const analyseViews = document.getElementsByClassName("analyseViewContainer");
    for (let view of analyseViews) {
        view.style.display = "block";
    }
    document.getElementById("mainViewer").style.display = "none";
    updateWindowSize();
}
// Add renderers
addRenderer("primaryRenderer", document.getElementById('mainViewer'), true);
addRenderer("rendererTopRight", document.getElementById('topRightViewer'));
addRenderer("rendererTopLeft", document.getElementById('topLeftViewer'), true);
addRenderer("rendererBottomRight", document.getElementById('bottomRightViewer'));
addRenderer("rendererBottomLeft", document.getElementById('bottomLeftViewer'));
addRenderer("analyseRenderer", document.getElementById('topRightAnalyseViewer'), true, [1, 1, 1]);

// Set camera directions
renderers["rendererTopRight"]["renderer"].getActiveCamera().setDirectionOfProjection(0, 0, 1);
renderers["rendererTopLeft"]["renderer"].getActiveCamera().setDirectionOfProjection(1, 1, 1);
renderers["rendererBottomRight"]["renderer"].getActiveCamera().setDirectionOfProjection(0, 1, 0);
renderers["rendererBottomLeft"]["renderer"].getActiveCamera().setDirectionOfProjection(1, 0, 0);


// Static cameras use parallel projection
renderers["rendererTopRight"]["renderer"].getActiveCamera().setParallelProjection(true);
renderers["rendererBottomRight"]["renderer"].getActiveCamera().setParallelProjection(true);
renderers["rendererBottomLeft"]["renderer"].getActiveCamera().setParallelProjection(true);

var maxScalarRange = 0;
var minScalarRange = 0;

showMainView();

/**
 * Make the window fit into the div container
 */
function updateWindowSize() {
    // Update window size when window size changes
    for (var renderObject of Object.values(renderers)) {
        const {width, height} = renderObject["container"].getBoundingClientRect();
        renderObject["openglRenderWindow"].setSize(width, height);
        renderObject["renderer"].getRenderWindow().render();
        if (renderObject.interactor === undefined) {
            renderObject["container"].style.cursor = "default"
        }
    }

    updateScalarHeight();
}

window.addEventListener("resize", updateWindowSize);
updateWindowSize();

// ----------------------------------------------------------------------------
// Add scans
// ----------------------------------------------------------------------------
var rolled = false;

/**
 * Reset the view so that the objects all fit in the view window
 */
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

/**
 * For the analyse slicing
 * Update the distance to the slice
 */
function updateSlices() {
    // If slicing is enabled
    if (document.getElementById("sliceToggle").checked) {
        let displacement = document.getElementById("sliceDistanceSlider").value/1;
        clippedCamera = renderers["rendererTopRight"]["renderer"].getActiveCamera();
        const sliceThickness = document.getElementById("sliceThicknessSlider").value/1;
        // const cutter = vtk.Filters.Core.vtkCutter.newInstance();
        // cutter.setCutFunction(vtk.Common.DataModel.vtkPlane);
        // cutter.setInputConnection(objects[getAlignMoving()].actor);
        // const cutMapper = vtk.Rendering.Core.vtkMapper.newInstance();
        // cutMapper.setInputConnection(cutter.getOutputPort());
        // const cutActor = vtk.Rendering.Core.vtkActor.newInstance();
        // const cutProperty = cutActor.getProperty();
        // cutProperty.setRepresentation(vtk.Rendering.Core.vtkProperty.Representation.WIREFRAME);
        // cutProperty.setLighting(false);
        // cutProperty.setColor(0, 1, 0);
        // renderers["rendererTopRight"]["renderer"].addActor(cutActor);
        // objects[getAlignMoving()].actor.setVisibility(false);


        clippedCamera.setClippingRange(
            clippedCamera.getDistance()+displacement,
            clippedCamera.getDistance()+displacement + sliceThickness);
        renderers["rendererTopRight"]["renderer"].getRenderWindow().render();
    }
}


var lookupTable;

/**
 * Rerender the vtk window
 */
function refreshVTK() {
    for (var renderObject of Object.values(renderers)) {
        renderObject["renderer"].getRenderWindow().render(); // Rerender
    }
}

/**
 *
 * @param objID
 */
function hideObject(objID) {
    objects[objID].display = false;
    objects[objID].actor.setVisibility(false);
}

function updateEdges() {
    let edgesEnabled = document.getElementById("edgesTickbox").checked;
    for (objID in objects) {
        if (objects[objID].actor !== null) {
            if (edgesEnabled)
                objects[objID].actor.getProperty().setRepresentationToWireframe();
            else
                objects[objID].actor.getProperty().setRepresentationToSurface();
        }
    }
    refreshVTK();
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

setupHomePanel();

addWrapperListener();

setupAlignViewProperties();

addAlignButtons();

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

setupTabs();
updateDropdown();


function showProcessingScreen() {
    // document.getElementById("processingScreen").style.display = "block"
    document.getElementById("processingScreen").style["animation-name"] = "fadeInEffect";
    document.getElementById("processingScreen").style["pointer-events"] = "all";
}
function hideProcessingScreen() {
    // document.getElementById("processingScreen").style.display = "none"
    document.getElementById("processingScreen").style["animation-name"] = "fadeOutEffect";
    document.getElementById("processingScreen").style["pointer-events"] = "none";
}

var currentPickingObject = "";


function addSlicePlane() {
    // vtk.js/Sources/Filters/Sources
    const planeSource = vtk.Filters.Sources.vtkPlaneSource.newInstance();
    const mapper = vtk.Rendering.Core.vtkMapper.newInstance();
    const actor = vtk.Rendering.Core.vtkActor.newInstance();

    actor.getProperty().setRepresentationToWireframe();
    actor.getProperty().setColor(0, 255, 0);

    actor.SetScale(100, 100, 100);
    // TODO Needs to scale

    mapper.setInputConnection(planeSource.getOutputPort());
    actor.setMapper(mapper);

    renderers["primaryRenderer"]["renderer"].addActor(actor);
    renderers["primaryRenderer"]["renderer"].resetCamera();
    renderers["primaryRenderer"]["renderer"].getRenderWindow().render();

    planeSource.set({ [propertyName]: value });
}
addSlicePlane();