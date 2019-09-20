
function resetPickingObject() {
    setPickingObject("");
    document.getElementById("pickingText").innerHTML = ""
}

function setPickingObject(val) {
    currentPickingObject = val;
    document.getElementById("pickingText").innerHTML = "Right click on mid-patella on scan to pick point"
}


function addPicker(actor, renderer, objID) {
    const picker = vtk.Rendering.Core.vtkPointPicker.newInstance();
    picker.setPickFromList(1);
    picker.initializePickList();
    picker.addPickList(actor);

    // Pick on mouse right click
    renderer.getRenderWindow().getInteractor().onRightButtonPress((callData) => {
        if (currentPickingObject !== objID) {
            return
        }
        if (renderer !== callData.pokedRenderer) {
            return;
        }

        const pos = callData.position;
        const point = [pos.x, pos.y, 0.0];
        console.log(`Pick at: ${point}`);
        picker.pick(point, renderer);

        if (picker.getActors().length === 0) {
            const pickedPoint = picker.getPickPosition();
            console.log(`No point picked, default: ${pickedPoint}`);
            const sphere = vtk.Filters.Sources.vtkSphereSource.newInstance();
            sphere.setCenter(pickedPoint);
            sphere.setRadius(0.01);
            const sphereMapper = vtk.Rendering.Core.vtkMapper.newInstance();
            sphereMapper.setInputData(sphere.getOutputData());
            const sphereActor = vtk.Rendering.Core.vtkActor.newInstance();
            sphereActor.setMapper(sphereMapper);
            sphereActor.getProperty().setColor(1.0, 0.0, 0.0);
            renderer.addActor(sphereActor);
        } else {
            const pickedPointId = picker.getPointId();
            console.log('Picked point: ', pickedPointId);

            const pickedPoints = picker.getPickedPositions();
            for (let i = 0; i < pickedPoints.length; i++) {
                const pickedPoint = pickedPoints[i];
                console.log(`Picked: ${pickedPoint}`);
                const sphere = vtk.Filters.Sources.vtkSphereSource.newInstance();
                sphere.setCenter(pickedPoint);
                sphere.setRadius(5);
                const sphereMapper = vtk.Rendering.Core.vtkMapper.newInstance();
                sphereMapper.setInputData(sphere.getOutputData());
                const sphereActor = vtk.Rendering.Core.vtkActor.newInstance();
                sphereActor.setMapper(sphereMapper);
                sphereActor.getProperty().setColor(0.0, 1.0, 0.0);
                renderer.addActor(sphereActor);
            }
        }
        renderer.getRenderWindow().render();
        resetPickingObject();
    });
}