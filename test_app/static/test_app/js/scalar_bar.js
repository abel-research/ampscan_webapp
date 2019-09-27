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

function getScalarMax() {
    return document.getElementById("")
}

function getColourValues(lut) {
    const table = lut.getTable();
    const colours = [];
    const offset = 0.01/lut.getNumberOfColors()
    const spacing = 1.0/lut.getNumberOfColors()
    for (let i = 0; i < lut.getNumberOfColors(); i++) {
        colours.push([""+i/(lut.getNumberOfColors()),
            "rgb("+table[i * 4].toFixed(0)
            + "," + table[i * 4 + 1].toFixed(0)
            + "," + table[i * 4 + 2].toFixed(0) + ")"]);
            colours.push([""+(i+1)/(lut.getNumberOfColors()),
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
    // let scalarMin = document.getElementById("scalarMin");
    // let scalarMax = document.getElementById("scalarMax");
    // document.getElementById("scalarMinLabel").innerHTML = scalarMin.value/1 + "mm";
    // document.getElementById("scalarMaxLabel").innerHTML = scalarMax.value/1 + "mm";
    let lowerRange = getMinScalar();
    let upperRange = getMaxScalar();
    objects[objID].actor.getMapper().setScalarRange(lowerRange, upperRange);
    // document.getElementById("scalarMin").max = getMaxScalar()-1;
    // document.getElementById("scalarMax").min = getMinScalar();
    createScalarBar(lookupTable, document.getElementById("legend"));
    createTicks(lowerRange, upperRange);
    updateScalarHeight(getNoTicks(lowerRange, upperRange));
    updateRegistrationGraph();
    refreshVTK();
}

// Update the scalar max/min ranges for the sliders
function updateScalarsMaxMin() {
    var sliderSections = document.getElementsByClassName("range-slider");
    for (var x = 0; x < sliderSections.length; x++) {
        var sliders = sliderSections[x].getElementsByTagName("input");
        for (var y = 0; y < sliders.length; y++) {
            if (sliders[y].type === "range") {
                let abs = Math.max(Math.abs(minScalar), Math.abs(maxScalar)).toFixed(0);
                if (!isAbsErrorEnabled()) {
                    sliders[y].min = -abs;
                } else {
                    sliders[y].min = 0;
                }
                sliders[y].max = abs;
            }
        }
    }
}

function scalarsRangeChanged() {
    updateScalars("_regObject");
}

function getNoTicks() {
    let lowerRange = getMinScalar();
    let upperRange = getMaxScalar();

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


function getMaxScalar() {
    return _maxScalar
}

function getMinScalar() {
    return _minScalar
}
let _maxScalar=5, _minScalar=-5;

// Double slider from https://stackoverflow.com/questions/4753946/html5-slider-with-two-inputs-possible
function getVals() {
    // Get double slider values
    var parent = this.parentNode;
    var slides = parent.getElementsByTagName("input");
    var slide1 = parseFloat(slides[0].value);
    var slide2 = parseFloat(slides[1].value);
    // Neither slider will clip the other, so make sure we determine which is larger
    if (slide1 > slide2) {
        var tmp = slide2;
        slide2 = slide1;
        slide1 = tmp;
    }
    _minScalar = slide1;
    _maxScalar = slide2;
    var displayElement = parent.getElementsByClassName("rangeValues")[0];
    displayElement.innerHTML = slide1 + "mm - " + slide2 + "mm";
    if ("_regObject" in objects)
        updateScalars("_regObject");
}

window.onload = function(){
  // Initialize Sliders
  var sliderSections = document.getElementsByClassName("range-slider");
      for( var x = 0; x < sliderSections.length; x++ ){
        var sliders = sliderSections[x].getElementsByTagName("input");
        for( var y = 0; y < sliders.length; y++ ){
          if( sliders[y].type ==="range" ){
            sliders[y].oninput = getVals;
            // Manually trigger event first time to display values
            sliders[y].oninput();
            // sliders[y].addEventListener("oninput", function() {
            //     console.log(123)
            //     updateScalars("_regObject");
            //     getVals();
            // })
          }
        }
      }
};
