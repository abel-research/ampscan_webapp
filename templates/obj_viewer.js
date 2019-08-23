


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
    const { width, height } = container2.getBoundingClientRect();
    openglRenderWindow.setSize(width, height+10);//+10 for no gap
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

function polyProcess() {
    polyData = vtk.Common.DataModel.vtkPolyData.newInstance()
    fetch("download/polydata") 
    .then(function(response) {
        // Convert reponse to json
        return response.json();
    })
    .then(function(jsonResponse) {
        polyData.getPoints().setData(jsonResponse["verts"], 3);    
        polyData.getPolys().setData(jsonResponse["faces"]);
        const vtkNorm = vtk.Common.Core.vtkDataArray.newInstance({
            numberOfComponents: 1,
            values: jsonResponse["norm"]
        })
        polyData.getPointData().setNormals(vtkNorm);
        update(polyData);
    });
}

var busy = false;
function rotate(x, y, z) {
    busy = true;
    // Add the data
    var data  = new FormData();
    data.append("x", String(x));
    data.append("y", String(y));
    data.append("z", String(z));

    // Submit the request
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "align", true);
    xhttp.setRequestHeader("X-CSRFToken", csrftoken);
    xhttp.send(data);
    // When reponse is recieved
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            polyProcess();
        }
    }
    busy = false;
}

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

const containerFile = document.getElementById('File');
const containerRotate = document.getElementById('Align');

// Add upload button
const upload_button = document.createElement('BUTTON');
upload_button.innerHTML = 'Show';
containerFile.appendChild(upload_button);
upload_button.addEventListener('click', polyProcess);

// Add rotate button
const rotate_button = document.createElement('BUTTON');
rotate_button.innerHTML = 'Rotate';
containerRotate.appendChild(rotate_button);
rotate_button.addEventListener('click', function(){ rotate(0.1, 0, 0); });

// Add rotate2 button
const rotate2_button = document.createElement('BUTTON');
rotate2_button.innerHTML = 'Rotate Back';
containerRotate.appendChild(rotate2_button);
var intervalId;
rotate2_button.addEventListener("mousedown", function(){
    intervalId = setInterval(function(){
        if (!busy){
            rotate(-0.1, 0, 0);
        }
    }, 200);  
});
rotate2_button.addEventListener("mouseup", function() {
    clearInterval(intervalId);
});;


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
