

/**
 * Creates the scalar bar dynamically based on the number of colours
 *
 * @param lut the lookup table used by the mapper for the registration objects
 *
 * @param container The div container for this to be placed in
 */
function createScalarBar(lut, container) {
    const table = lut.getTable();

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    let rgba1 = [];
    let legendDiv = container;
    var newSpan = document.createElement("span");
    newSpan.classList.add("key");
    document.getElementById("keyLabel").innerHTML = "Shape Deviation /mm";
    legendDiv.appendChild(newSpan);
    var ul = document.createElement("div");
    ul.style.setProperty("list-style", "none");
    legendDiv.appendChild(ul);
    for (let i = table.length/4-4; i >= 0; i--) {
        var newli = document.createElement("div");
        rgba1[0] = table[i*4];
        rgba1[1] = table[i*4 + 1];
        rgba1[2] = table[i*4 + 2];
        rgba1[3] = table[i*4 + 3];
        newli.style.backgroundColor = "rgb(" + rgba1 + ")";
        newli.classList.add("colourLegend");
        ul.appendChild(newli);
    }
    updateScalarHeight(lut);

    createTicks(4, 0, 80, Nocolours);
}

function updateScalarHeight(lut) {
    if (lut !== undefined) {
        document.documentElement.style.setProperty(
            '--legendColourRowHeight',
            (window.outerHeight - 60 * 2) / (lut.getTable().length / 4) + 'px');
    }
    else if (lookupTable !== undefined) {
        document.documentElement.style.setProperty(
            '--legendColourRowHeight',
            (window.outerHeight - 60 * 2) / (lookupTable.getTable().length / 4) + 'px');
    }
}

// Update the scalar ranges
function updateScalars(objID) {
    let scalarMin = document.getElementById("scalarMin");
    let scalarMax = document.getElementById("scalarMax");
    document.getElementById("scalarMinLabel").innerHTML = scalarMin.value/1 + "mm";
    document.getElementById("scalarMaxLabel").innerHTML = scalarMax.value/1 + "mm";
    let mn = scalarMin.value / 1;
    let mx = scalarMax.value / 1;
    objects[objID].actor.getMapper().setScalarRange(mn, mx);
    document.getElementById("scalarMin").max = document.getElementById("scalarMax").value;
    document.getElementById("scalarMax").min = document.getElementById("scalarMin").value;
    refreshVTK();
}

// Update the scalar max/min ranges for the sliders
function updateScalarsMaxMin() {
    document.getElementById("scalarMin").min = minScalar.toFixed(0);
    document.getElementById("scalarMax").max = maxScalar.toFixed(0);
}
var maxScalar = 0;
var minScalar = 0;

function scalarsRangeChanged() {
    updateScalars("_regObject");
}

/**
 * Creates the ticks for the scalar bar dynamically based on the max and min pressure amounts, no of ticks and the no of colours
 *
 * @param No - the number of ticks
 * @param min - the minimum pressure amount
 * @param max - the maximum pressure amount
 * @param Nocolours - the no of colours in the colour map
 */
function createTicks(No, min, max, Nocolours) {
    step = (max - min) / No;
    tickDiv = document.getElementById("tick-legend");
    var ul = document.createElement("ul");
    ul.classList.add("tickUl");
    ul.style.setProperty("list-style", "none");
    ul.setAttribute("class", "colourList");
    tickDiv.appendChild(ul);
    height = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--legendColourRowHeight')) * Nocolours;
    document.documentElement.style.setProperty("--legendLabelRowHeight", (height / No + "px"));
    for (let i = 0; i <= No; i++) {
        var newLi = document.createElement("li");
        newLi.innerText = Math.floor((max - (i * step)));
        newLi.classList.add("tickLegend");
        if (i === No) {
            newLi.classList.add("bottomTick");
            newLi.classList.remove("tickLegend");
        }
        ul.appendChild(newLi);
    }
}

