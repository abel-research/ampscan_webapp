


function updateAnalyse() {

    // Update the analyse dropdown


    let dropdown = document.getElementById("visualiationTargetDropdown");
    let si = dropdown.selectedIndex;
    for (const i in objects) {
        dropdown.options[dropdown.options.length] = undefined;
    }
    dropdown.options.length = 0;
    dropdown.options[0] = new Option("", "");
    let anObjs = getAnalyseObjects();
    for (let i = 0; i < anObjs.length; i ++) {
        dropdown.options[dropdown.options.length] = new Option(anObjs[i], anObjs[i]);
    }
    dropdown.selectedIndex = si;

    for (const i in objects) {
        if (objects[i].name === getAnalyseTarget()) {
            objects[i].actor.setVisibility(true);
        } else {
            objects[i].actor.setVisibility(false);
        }
    }

    fetchCSAGraph(document.getElementById("bottomLeftAnalyseViewer"));
    fetchDataTable();
    fetchDeviationHistogram(document.getElementById("bottomRightAnalyseViewer"));
    refreshVTK();
}

function getAnalyseTarget() {
    return document.getElementById("visualiationTargetDropdown").value;
}

function startPickingAnalyse() {
    // setPickingObject(getAnalyseBaseline());
}

function getAnalyseObjects() {
    let objs = [];
    for (const objID in objects) {
        if (objects[objID].display && objID !== "_regObject") {
            objs.push(objID);
        }
    }
    return objs;
}

function getAnalyseRegObjects() {
    let objs = [];
    for (const objID of getAnalyseObjects()) {
        if (objects[objID].type === "reg") {
            objs.push(objID);
        }
    }
    return objs;
}

function anyAnalyseRegObjects() {
    return getAnalyseRegObjects().length > 0
}

function getNumberOfBinsAnalyse() {
    return document.getElementById("noAnalyseBins").value/1;
}

function numberOfAnalyseBinChanged() {
    updateAnalyse();
}

function fetchDataTable() {

    let visObjects = getAnalyseObjects();
    let data = [];

    function fetchData() {
        if (visObjects.length > 0) {

            const formData = new FormData();
            formData.append("session", session_id);
            formData.append("objID", visObjects[0]);

            fetch("analyse/summary", {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken
                }
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (jsonresponse) {
                data.push([visObjects[0], jsonresponse.volume.toPrecision(4)]);
                visObjects.shift();  // Removes first element
                fetchData();
            });
        } else {
            updateDynamicTableData(document.getElementById("AnalyseDataTable"), data);
        }
    }
    fetchData();
}

function changeAnalyse3DView() {

}

function changeAnalyseVisualisation() {
    updateAnalyse()
}