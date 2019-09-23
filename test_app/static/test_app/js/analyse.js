


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

function fetchHistogram() {
    if (!anyAnalyseRegObjects()) {
        document.getElementById("bottomRightAnalyseViewer").style["background-color"] = "lightgrey";
        document.getElementById("bottomRightAnalyseViewer").innerText = "Add reg object to show deviation histogram"
    } else {
        document.getElementById("bottomRightAnalyseViewer").style["background-color"] = "white";

        let visObjects = getAnalyseRegObjects();
        let xData = [];
        let yData = [];

        let numColours = getNumberOfColours();
        let scalarMin = document.getElementById("scalarMin").value/1;
        let scalarMax = document.getElementById("scalarMax").value/1;

        function fetchData() {
            if (visObjects.length > 0) {

                const formData = new FormData();
                formData.append("session", session_id);
                formData.append("objID", visObjects[0]);
                formData.append("numColours", numColours);
                formData.append("scalarMin", scalarMin);
                formData.append("scalarMax", scalarMax);

                fetch("analyse/deviations", {
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
                    xData.push(jsonresponse.xData);
                    yData.push(jsonresponse.yData);
                    visObjects.shift();  // Removes first element
                    fetchData();
                });
            } else {
                console.log(xData, yData);
                addHistogram(
                    document.getElementById("bottomRightAnalyseViewer"),
                    "Shape Deviation", "density", "Shape deviation /mm",
                    xData, yData, visObjects
                );
            }
        }
        fetchData();

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