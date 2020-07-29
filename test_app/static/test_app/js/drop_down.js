
// ----------------------------------------------------------------------------
// Drop downs
// ----------------------------------------------------------------------------

function revealAllObjectsDisplayed() {
    for (i in objects) {
        objects[i].resetVis();
    }
    refreshVTK();
}

function updateDropdown() {
    let dropdowns = document.getElementsByClassName('targetDropdown');
    for (dd=0; dd<dropdowns.length; dd++) {
        let dropdown = dropdowns[dd];
        let si = dropdown.selectedIndex;
        for (const i in objects) {
            dropdown.options[dropdown.options.length] = undefined;
        }
        dropdown.options.length = 0;
        dropdown.options[0] = new Option("", "");
        for (const i in objects) {
            if (i !== "_regObject")
                dropdown.options[dropdown.options.length] = new Option(objects[i].name, i);
        }
        dropdown.selectedIndex = si;
    }

    if (getCurrentTab() === "Align") {
        updateAlign();
    }

    if (getCurrentTab() === "Register") {
        updateRegistration();
    }

    if (getCurrentTab() === "Analyse") {
        updateAnalyse();
        // fetchAnalysisGraph();
    }

    if (getCurrentTab() === "Home") {
        updateHome();
        // fetchAnalysisGraph();
    }
    updateScalarVisiblity();
}

function setupAlignViewProperties () {
    // Set up colour picker inputs
    document.getElementById("alignStaticColour").addEventListener("input", function (event) {
        const newColour = event.target.value;
        if (getAlignStatic() !== "") {
            objects[getAlignStatic()].changeColourTemp(newColour);
        }
    });


    document.getElementById("alignMovingColour").addEventListener("input", function (event) {
        const newColour = event.target.value;
        if (getAlignMoving() !== "") {
            objects[getAlignMoving()].changeColourTemp(newColour);
        }
    });

    // Set up opacity sliders
    document.getElementById("alignStaticOpacity").addEventListener("input", function (event) {
        const newOpacity = event.target.value;
        if (getAlignStatic() !== "") {
            objects[getAlignStatic()].changeOpacityTemp(newOpacity);
        }
    });

    document.getElementById("alignMovingOpacity").addEventListener("input", function (event) {
        const newOpacity = event.target.value;
        if (getAlignMoving() !== "") {
            objects[getAlignMoving()].changeOpacityTemp(newOpacity);
        }
    });
}


function getHomeTarget() {
    return document.getElementById("homeDropdown").value;
}