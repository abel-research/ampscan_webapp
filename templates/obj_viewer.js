
var fullScreenRenderer = vtk.Rendering.Misc.vtkFullScreenRenderWindow.newInstance( {
    containerStyle: {
      height: '500px',
      width: '500px',
      overflow: 'hidden',
    }
  } );


//Set default options to renderer
fullScreenRenderer.getRenderer().getActiveCamera().setParallelProjection(true);
var prevActor = null;

function update() {
    var mapper = vtk.Rendering.Core.vtkMapper.newInstance({ scalarVisibility: false });
    var actor = vtk.Rendering.Core.vtkActor.newInstance();
    var reader = vtk.IO.Geometry.vtkSTLReader.newInstance();

    actor.setMapper(mapper);    
    mapper.setInputConnection(reader.getOutputPort());

    function addActor() {
        fullScreenRenderer.getRenderer().addActor(actor);
        if (prevActor != null)
            fullScreenRenderer.getRenderer().removeActor(prevActor);
        else {
            fullScreenRenderer.getRenderer().resetCamera();
        }
        prevActor = actor;
        fullScreenRenderer.getRenderWindow().render();
    }

    reader.setUrl( "download", { binary: true }).then(addActor);
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
            update();
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

const container = document.querySelector('body');

// Add upload button
const upload_button = document.createElement('BUTTON');
upload_button.innerHTML = 'Show';
container.appendChild(upload_button);
upload_button.addEventListener('click', update);

// Add rotate button
const rotate_button = document.createElement('BUTTON');
rotate_button.innerHTML = 'Rotate';
container.appendChild(rotate_button);
rotate_button.addEventListener('click', function(){ rotate(0.1, 0, 0); });

// Add rotate2 button
const rotate2_button = document.createElement('BUTTON');
rotate2_button.innerHTML = 'Rotate Back';
container.appendChild(rotate2_button);
var intervalId;
rotate2_button.addEventListener("mousedown", function(){
    intervalId = setInterval(function(){
        if (!busy){
            rotate(-0.1, 0, 0);
        }
    }, 50);  
});
rotate2_button.addEventListener("mouseup", function() {
    clearInterval(intervalId);
});;


