

function getAnalyseBaseline() {
    const dropdown = document.getElementById("analyseTargetDropdown");
    if (dropdown.selectedIndex !== -1) {
        return dropdown.options[dropdown.selectedIndex].text;
    } else {
        return "";
    }
}

function updateAnalyse() {
    for (i in objects) {
        if (objects[i].name === getAnalyseBaseline()) {
            objects[i].actor.setVisibility(true);
        } else {
            objects[i].actor.setVisibility(false);
        }
    }
    // fetchCSAGraph();
    refreshVTK();
}

function startPickingAnalyse() {
    setPickingObject(getAnalyseBaseline());
}