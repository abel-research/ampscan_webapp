tempID = "stl_file"

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
var prevActor = null;

function update(polyData) {
    var mapper = vtk.Rendering.Core.vtkMapper.newInstance({ scalarVisibility: true });
    var actor = vtk.Rendering.Core.vtkActor.newInstance();

    actor.setMapper(mapper);    
    mapper.setInputData(polyData);

    function addActor() {
        // Remove any previous actors
        renderer.addActor(actor);
        if (prevActor != null)
            renderer.removeActor(prevActor);
        else {
            renderer.resetCamera();
        }
        prevActor = actor;
        renderer.getRenderWindow().render();
    }
    addActor();
}

function downloadPolyDataAndUpdate() {
    polyData = vtk.Common.DataModel.vtkPolyData.newInstance()
    
    const formData = new FormData();
    formData.append("norms", isNormsSelected());
    formData.append("session", session_id);

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
        update(polyData);
    });
}

function rotate(x, y, z) {
    // Add the data
    var formData  = new FormData();
    formData.append("x", String(x));
    formData.append("y", String(y));
    formData.append("z", String(z));

    formData.append("objID", tempID);
    formData.append("session", session_id);

    // Submit the request to rotate
    fetch("align", {
        method: 'POST',
        body: formData,
        headers: {
        'X-CSRFToken': csrftoken
        },
    }).then(function (reponse) {
        downloadPolyDataAndUpdate();
    })
}

function upload(file) {

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
// Setup File panel
// ----------------------------------------------------------------------------
const containerFile = document.getElementById('File');

// Add upload button
// const upload_button = document.createElement('BUTTON');
// upload_button.innerHTML = 'Show';
// containerFile.appendChild(upload_button);
// upload_button.addEventListener('click', polyProcess);

// Add upload button
var upload_button = document.createElement("INPUT");
upload_button.setAttribute("accept", ".stl")
upload_button.setAttribute("type", "file");
containerFile.appendChild(upload_button);
upload_button.addEventListener('change', e => {
    // Get the file from the upload button
    const files = upload_button.files;
    if (!files.length) {
        // Check file is selected
        // If not don't do anything
        return;
    }
    const formData = new FormData();
    formData.append('user_file', files[0])
    formData.append("session", session_id);
    
    // Send upload request
    fetch("upload/scan", {
        method: 'POST',
        body: formData,
        headers: {
        'X-CSRFToken': csrftoken
        },
    }).then(response => {
        // When reponse is recieved
        downloadPolyDataAndUpdate();
    })

})

// ----------------------------------------------------------------------------
// Setup Rotate panel
// ----------------------------------------------------------------------------
const containerRotate = document.getElementById('Align');

// Add rotate button
const rotate_button = document.createElement('BUTTON');
rotate_button.innerHTML = 'Rotate';
containerRotate.appendChild(rotate_button);
rotate_button.addEventListener('click', function(){ rotate(0.1, 0, 0); });

// Add rotate2 button
const rotate2_button = document.createElement('BUTTON');
rotate2_button.innerHTML = 'Rotate Back';
containerRotate.appendChild(rotate2_button);
rotate2_button.addEventListener('click', function(){ rotate(-0.1, 0, 0); });

// ----------------------------------------------------------------------------
// Setup object panel
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// Setup settings panel
// ----------------------------------------------------------------------------

// Default to checked
selectNorms(true);

function normsChange() {
    // When the tickbox is change, update the stl
    downloadPolyDataAndUpdate();
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

document.getElementById("defaultTabOpen").click();

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
  
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
  }
