


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

