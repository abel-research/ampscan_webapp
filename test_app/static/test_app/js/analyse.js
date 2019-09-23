


function updateAnalyse() {

    fetchCSAGraph(document.getElementById("bottomLeftAnalyseViewer"));
    fetchDataTable();
    fetchHistogram();
    refreshVTK();
}

function startPickingAnalyse() {
    // setPickingObject(getAnalyseBaseline());
}

function getAnalyseObjects() {
    let objs = [];
    for (const objID in objects) {
        if (objects[objID].display) {
            objs.push(objID);
        }
    }
    return objs;
}

function anyAnalyseRegObjects() {
    for (const objID in objects) {
        if (objects[objID].type === "reg") {
            return true
        }
    }
    return false;
}

function fetchHistogram() {
    if (!anyAnalyseRegObjects()) {
        document.getElementById("bottomRightAnalyseViewer").style["background-color"] = "lightgrey";
        document.getElementById("bottomRightAnalyseViewer").innerText = "Add reg object to show deviation histogram"
    } else {
        document.getElementById("bottomRightAnalyseViewer").style["background-color"] = "white";

    }
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