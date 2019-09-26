


function updateAnalyse() {

    // Update the analyse dropdown


    let dropdown = document.getElementById("visualisationTargetDropdown");
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

    fetchAnalysisGraph(document.getElementById("bottomLeftAnalyseViewer"));
    fetchDataTable();
    fetchDeviationHistogram(document.getElementById("bottomRightAnalyseViewer"), getAnalyseRegObjects(), getNumberOfBinsAnalyse());
    resetCamera();
    refreshVTK();
}

function getAnalyseTarget() {
    return document.getElementById("visualisationTargetDropdown").value;
}
function getCurrentAnalysisGraph() {
    return document.getElementById("analyseGraphSelector").value;
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

function getSliceWidth() {
    return document.getElementById("sliceWidth").value/1;
}

function setSliceWidth(v) {
    return document.getElementById("sliceWidth").value = v;
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
            formData.append("sliceWidth", getSliceWidth());

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
                data.push([visObjects[0], jsonresponse.volume.toPrecision(5)]);
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

function sliceWidthChanged() {
    // Sets the minimum slice width to 3
    if (getSliceWidth() < 3) {
        setSliceWidth(3);
    }
    updateAnalyse();
}

function changeAnalyseVisualisation() {
    updateAnalyse();
}

function setVisualisationTarget(objID) {
    const dropdown = document.getElementById("visualisationTargetDropdown");
    updateDropdown();
    options = dropdown.options;
    for (i = 0; i < options.length; i ++) {
        if (options[i].value === objID) {
            dropdown.selectedIndex = i;
            return;
        }
    }
    console.error("Obj not found: ".concat(objID));
    updateAnalyse();
}

function changeAnalyseGraphType() {
    fetchAnalysisGraph(document.getElementById("bottomLeftAnalyseViewer"));
}