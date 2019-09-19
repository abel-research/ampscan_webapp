

function createLUT() {
    const lookupTable = window.vtkNewLookupTable.newInstance();
    const numColors = getNumberOfColours();
    lookupTable.setNumberOfColors(numColors);
    lookupTable.build();
    createScalarBar(lookupTable, document.getElementById("legend"));
    return lookupTable
}

/**
 * Update the lookup table if for example the number of colours option has changed
 * @param objID
 */
function updateLookupTable(objID) {
    if (objects[objID] !== undefined && objects[objID].actor !== undefined) {
        let mapper = objects[objID].actor.getMapper();
        lookupTable = createLUT();
        mapper.setLookupTable(lookupTable);
        refreshVTK();
    }
}

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

        let renderObject;
        for (renderObject of Object.values(renderers)) {
            renderObject["renderer"].addActor(actor);
        }
        if (prevActor != null)
            for (renderObject of Object.values(renderers)) {
                renderObject["renderer"].removeActor(prevActor);
            }
        else {
            resetCamera();
        }
        for (renderObject of Object.values(renderers)) {
            renderObject["renderer"].getRenderWindow().render();
        }
        objects[objID].setActor(actor);
        objects[objID].resetVisibility();
        updateEdges();
    }
    addActor();

    return actor;
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
            maxScalar = mx;
            minScalar = mn;
            updateScalars(objID);
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
    }).catch(function(e) {
        alert("Scan download failed - probably due to improper registration attempted or presence of NaNs in object.");
        console.error(e)
    });
    return polyData;
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

function uploadScan(uploadInput) {
    // Get the file from the upload button
    showProcessingScreen();
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
    .then(function (response) {
        // Convert response to json
        return response.json();
    })
    .then(function (jsonResponse) {
        if (objects[jsonResponse["objID"]] === undefined) {
            objects[jsonResponse["objID"]] =
                new AmpObjectContainer(jsonResponse["objID"], jsonResponse["properties"]["display"], jsonResponse["properties"]["type"]);
        }
        downloadPolyDataAndUpdate(jsonResponse["objID"], function() {
            hideProcessingScreen();
        });
        uploadInput.value = null;
    });
}