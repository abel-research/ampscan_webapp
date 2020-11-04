

function addPicker(actor, renderer, objID) {
    const picker = vtk.Rendering.Core.vtkPointPicker.newInstance();
    picker.setPickFromList(1);
    picker.initializePickList();
    picker.addPickList(actor);
    

    // Pick on mouse right click
    renderer.getRenderWindow().getInteractor().onRightButtonPress((callData) => {

        console.log(selectedPoint)
        if (selectedPoint === -1) {
            return;
        }

        const pos = callData.position;
        const point = [pos.x, pos.y, 0.0];
        console.log(`Pick at: ${point}`);
        picker.pick(point, renderer);
        selectedPoints[selectedPoint] = picker.getPickPosition();

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
            let color = [0.0, 0.0, 0.0];
            color[selectedPoint] = 1;
            sphereActor.getProperty().setColor(color[0], color[1], color[2]);
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
                let color = [0.0, 0.0, 0.0];
                color[selectedPoint] = 1;
                sphereActor.getProperty().setColor(color[0], color[1], color[2]);
                renderer.addActor(sphereActor);
            }
        }
        renderer.getRenderWindow().render();
    });
}