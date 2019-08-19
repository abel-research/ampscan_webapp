
// import 'vtk.js/Sources/favicon';

// import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
// import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
// import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkSTLReader from 'vtk.js/Sources/IO/Geometry/STLReader';





// ----------------------------------------------------------------------------
//
// ----------------------------------------------------------------------------
var fullScreenRenderer = vtk.Rendering.Misc.vtkFullScreenRenderWindow.newInstance( {
    containerStyle: {
      height: '50%',
      width: '50%',
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

    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "align", true);
    xhttp.send();

    reader.setUrl( "download/", { binary: true }).then(addActor);
}

const container = document.querySelector('body');
const btn = document.createElement('BUTTON');
btn.innerHTML = 'Show';
container.appendChild(btn);
btn.addEventListener('click', update);
