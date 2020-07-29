
function resetPickingObject() {
    setPickingObject("");
    document.getElementById("pickingText").innerHTML = ""
}

function setPickingObject(val) {
    currentPickingObject = val;
    document.getElementById("pickingText").innerHTML = "Right click to select mid-patella on scan"
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

                // TODO add analyse download
                // const formData = new FormData();
                // formData.append("session", session_id);
                // formData.append("objID", objID);
                // formData.append("x", pickedPoint[0]);
                // formData.append("y", pickedPoint[1]);
                // formData.append("z", pickedPoint[2]);
                //
                // fetch("analyse/measurements", {
                //     method: 'POST',
                //     body: formData,
                //     headers: {
                //         'X-CSRFToken': csrftoken
                //     }
                // })
                // .then(function (response) {
                //     // Download file at address
                //     const url = window.URL.createObjectURL(blob);
                //     const a = document.createElement('a');
                //     a.style.display = 'none';
                //     a.href = url;
                //     // the filename to download to
                //     a.download = objID+'_report.pdf';
                //     document.body.appendChild(a);
                //     a.click();
                //     window.URL.revokeObjectURL(url);
                // }).catch(() => alert('File download failed'));
            }
        }
        renderer.getRenderWindow().render();
        resetPickingObject();
    });
}