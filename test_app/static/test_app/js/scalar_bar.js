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
    for (let i = table.length/4-4; i >= 0; i--) {
        let newli = document.createElement("div");
        rgba1[0] = table[i*4];
        rgba1[1] = table[i*4 + 1];
        rgba1[2] = table[i*4 + 2];
        rgba1[3] = table[i*4 + 3];
        newli.style.backgroundColor = "rgb(" + rgba1 + ")";
        newli.classList.add("colourLegend");
        container.appendChild(newli);
    }
    updateScalarHeight(lut);

}

function updateScalarHeight(lut) {
    let noColours;
    if (lut !== undefined) {
        noColours = (lut.getTable().length / 4);
        for (const elem of document.getElementsByClassName("colourLegend")) {
            elem.style.height = 100/(noColours) + "%";
        }
        // document.documentElement.style.setProperty("--legendColourRowHeight", 100/(noColours) + "%");
    }
    else if (lookupTable !== undefined) {
        noColours = (lookupTable.getTable().length / 4);
        for (const elem of document.getElementsByClassName("colourLegend")) {
            elem.style.height = 100/(noColours) + "%";
        }
        // document.documentElement.style.setProperty("--legendColourRowHeight", 100/(noColours) + "%");
    }
}

// Update the scalar ranges
function updateScalars(objID) {
    let scalarMin = document.getElementById("scalarMin");
    let scalarMax = document.getElementById("scalarMax");
    document.getElementById("scalarMinLabel").innerHTML = scalarMin.value/1 + "mm";
    document.getElementById("scalarMaxLabel").innerHTML = scalarMax.value/1 + "mm";
    let lowerRange = scalarMin.value / 1;
    let upperRange = scalarMax.value / 1;
    objects[objID].actor.getMapper().setScalarRange(lowerRange, upperRange);
    document.getElementById("scalarMin").max = document.getElementById("scalarMax").value;
    document.getElementById("scalarMax").min = document.getElementById("scalarMin").value;
    createScalarBar(lookupTable, document.getElementById("legend"));
    createTicks(lowerRange, upperRange);
    refreshVTK();
}

// Update the scalar max/min ranges for the sliders
function updateScalarsMaxMin() {
    document.getElementById("scalarMin").min = minScalar.toFixed(0);
    document.getElementById("scalarMax").max = maxScalar.toFixed(0);
}

function scalarsRangeChanged() {
    updateScalars("_regObject");
}

/**
 * Creates the ticks for the scalar bar dynamically based on the max and min pressure amounts, no of ticks and the no of colours
 * @param noTicks - the number of ticks
 * @param min - the minimum pressure amount
 * @param max - the maximum pressure amount
 * @param noColours - the no of colours in the colour map
 */
function createTicks(min, max) {
    let noTicks = max-min;
    while (noTicks < 10 && noTicks !== 0) {
        noTicks *= 2;
    }
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

