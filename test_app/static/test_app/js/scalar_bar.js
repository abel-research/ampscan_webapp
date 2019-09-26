/**
 * Creates the scalar bar dynamically based on the number of colours
 *
 * @param lut the lookup table used by the mapper for the registration objects
 *
 * @param container The div container for this to be placed in
 * @param lowerRange
 * @param upperRange
 */
function createScalarBar(lut, container) {
    const table = lut.getTable();

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    let rgba1 = [];
    document.getElementById("keyLabel").innerHTML = "Shape Deviation /mm";
    for (let i = lut.getNumberOfColors()-1; i >= 0; i--) {
        let newli = document.createElement("div");
        rgba1[0] = table[i*4];
        rgba1[1] = table[i*4 + 1];
        rgba1[2] = table[i*4 + 2];
        rgba1[3] = table[i*4 + 3];
        newli.style.backgroundColor = "rgb(" + rgba1 + ")";
        newli.classList.add("colourLegend");
        container.appendChild(newli);
    }
}

function getColourValues(lut) {
    const table = lut.getTable();
    const colours = [];
    for (let i = 0; i < lut.getNumberOfColors(); i++) {
        colours.push([""+i/(lut.getNumberOfColors()-1),
            "rgb("+table[i * 4].toFixed(0)
            + "," + table[i * 4 + 1].toFixed(0)
            + "," + table[i * 4 + 2].toFixed(0) + ")"]);
    }
    return colours
}

function updateScalarHeight() {
    let noTicks = getNoTicks();
    let noColours = getNumberOfColours();
    for (const elem of document.getElementsByClassName("colourLegend")) {
        elem.style.height = (100/(noColours) * (1-1/(noTicks+0.9))) + "%";
    }
}

function updateScalarVisiblity() {
    if (anyObjectsVisibleRegType() && getCurrentTab() !== "Analyse") {
        document.getElementById("scalarBarContainer").style.display = "grid";
    } else {
        document.getElementById("scalarBarContainer").style.display = "none";
    }
}

// Update the scalar ranges
function updateScalars(objID) {
    lookupTable = createLUT();
    let scalarMin = document.getElementById("scalarMin");
    let scalarMax = document.getElementById("scalarMax");
    document.getElementById("scalarMinLabel").innerHTML = scalarMin.value/1 + "mm";
    document.getElementById("scalarMaxLabel").innerHTML = scalarMax.value/1 + "mm";
    let lowerRange = scalarMin.value / 1;
    let upperRange = scalarMax.value / 1;
    objects[objID].actor.getMapper().setScalarRange(lowerRange, upperRange);
    document.getElementById("scalarMin").max = document.getElementById("scalarMax").value-1;
    document.getElementById("scalarMax").min = document.getElementById("scalarMin").value;
    createScalarBar(lookupTable, document.getElementById("legend"));
    createTicks(lowerRange, upperRange);
    updateScalarHeight(getNoTicks(lowerRange, upperRange));
    updateRegistrationGraph();
    refreshVTK();
}

// Update the scalar max/min ranges for the sliders
function updateScalarsMaxMin() {
    let abs = Math.max(Math.abs(minScalar), Math.abs(maxScalar)).toFixed(0);
    if (!isAbsErrorEnabled()) {
        document.getElementById("scalarMin").min = -abs;
    }
    else {
        document.getElementById("scalarMin").min = 0;
    }
    document.getElementById("scalarMax").max = abs;
}

function scalarsRangeChanged() {
    updateScalars("_regObject");
}

function getNoTicks() {
    let lowerRange = document.getElementById("scalarMin").value / 1;
    let upperRange = document.getElementById("scalarMax").value / 1;

    let noTicks = upperRange-lowerRange;
    while (noTicks < 6 && noTicks !== 0) {
        noTicks *= 2;
    }
    return noTicks;
}

/**
 * Creates the ticks for the scalar bar dynamically based on the max and min pressure amounts, no of ticks and the no of colours
 * @param noTicks - the number of ticks
 * @param min - the minimum scalar amount
 * @param max - the maximum scalar amount
 * @param noColours - the no of colours in the colour map
 */
function createTicks(min, max) {
    let noTicks = getNoTicks();
    let step = ((max.toFixed(8) - min.toFixed(8)) / (noTicks.toFixed(8)));
    let tickDiv = document.getElementById("scaleContainer");

    // Clear div
    while (tickDiv.firstChild) {
        tickDiv.removeChild(tickDiv.firstChild);
    }

    document.documentElement.style.setProperty("--legendLabelRowHeight", 100/(noTicks+1) + "%");

    for (let i = 0; i <= noTicks; i++) {
        let tick = document.createElement("div");
        tick.innerText = "" + (max - (i * step));
        tick.classList.add("tickLegend");
        // if (i === No) {
        //     tick.classList.add("bottomTick");
        //     tick.classList.remove("tickLegend");
        // }
        tickDiv.appendChild(tick);
    }
}

