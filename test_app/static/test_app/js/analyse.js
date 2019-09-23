


function updateAnalyse() {

    fetchCSAGraph(document.getElementById("bottomLeftAnalyseViewer"));
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
