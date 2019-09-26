const Plotly = parent.window.Plotly;

// Layout template for all graphs
function getLayout() {
    return {
        plot_bgcolor: "#fafafa",
        font: {
            size: "large",
            family: "Lato, sans-serif",
            color: "#000000",
        },
        margin: {
            "b": 70,
            "l": 60,
            "r": 40,
            "t": 30
        },
        xaxis: {
            fixedrange: true,
            showgrid: true,
            zeroline: false,
            gridcolor: '#ffffff',
            gridwidth: 3,
            ticks: "outside",
            tickwidth: 2,
            tickcolor:'#ffffff',
            ticklen:5
        },
        yaxis: {
            fixedrange: true,
            showgrid: true,
            gridcolor: '#ffffff',
            gridwidth: 3,
            zeroline: false,
            ticks: "outside",
            tickwidth: 2,
            tickcolor:'#ffffff',
            ticklen:5
        },
    };
}


/**
 * Puts the data in a format ready for plotly
 * @param dataset List of pairs corresponding to points on graph. May also be object mapping key to values.
 */
function extractData(dataset) {
    // Process dataset
    let xData = [];
    let yData = [];

    if (Array.isArray(dataset)) {
        // Process array case for dataset
        for (const pair of dataset) {
            xData.push(pair[0]);
            yData.push(pair[1]);
        }
    } else {
        // Process object case for dataset
        for (const pair of Object.entries(dataset)) {
            xData.push(pair[0]);
            yData.push(pair[1]);
        }
    }
    return [xData, yData]
}


function fetchGraphData(session_id1, objID, url, callback) {
    if (objects[objID] !== undefined) {
        const formData = new FormData();
        formData.append("session", session_id1);
        formData.append("objID", objID);
        formData.append("sliceWidth", getSliceWidth());

        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (jsonResponse) {
            let xData = jsonResponse["xData"];
            let yData = jsonResponse["yData"];
            callback(xData, yData);
        });
    } else {
        callback()
    }
}

function fetchAnalysisGraph(container) {
    let visObjects = getAnalyseObjects();
    let xData = [];
    let yData = [];

    let url;
    let title;
    let yAxisTitle;
    switch (getCurrentAnalysisGraph()) {
        case "CSA Graph":
            url = "analyse/csa";
            title = "Cross Sectional Area Graph";
            yAxisTitle = "Area /m²";
            break;
        case "Perimeter Graph":
            url = "analyse/perimeter";
            title = "Perimeter Graph";
            yAxisTitle = "Perimeter /m";
            break;
        case "Coronal Width Graph":
            url = "analyse/widths/cor";
            title = "Coronal Width Graph";
            yAxisTitle = "Width /m";
            break;
        case "Sagittal Width Graph":
            url = "analyse/widths/sag";
            title = "Sagittal Width Graph";
            yAxisTitle = "Width /m";
            break;
    }

    function fetchTrace() {
        if (visObjects.length > 0) {
            fetchGraphData(session_id, visObjects[0], url, function (x, y) {
                xData.push(x);
                yData.push(y);
                visObjects.shift();  // Removes first element
                fetchTrace();
            });
        } else {
            addLineGraph(container, title, "Length /%", yAxisTitle,
                xData, yData, getAnalyseObjects());
        }
    }
    fetchTrace();
}


/**
 * Adds a histogram to the container which resizes with it as the screen is resized
 * @param container The container to place the graph into
 * @param title The title displayed on the chart
 * @param xlabel
 * @param ylabel
 * @param xData
 * @param yData
 * @param traceNames
 */
function addLineGraph(container, title, xlabel, ylabel, xData, yData, traceNames) {

    // Process dataset
    let traces = [];
    for (let i = 0; i < xData.length; i++) {
        traces.push({
            type: 'scatter',
            name: traceNames[i],
            x: xData[i],
            y: yData[i],
            hoverinfo:"y"
        });
    }

    var data = traces;

    let layout = getLayout();
    layout.title = title;
    layout.xaxis.title = {text:xlabel};
    layout.yaxis.title = {text:ylabel};

    Plotly.newPlot(container, data, layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
    });
}


function fetchDeviationHistogram(container, objectsToShow, numColours) {
    if (!anyAnalyseRegObjects() && getCurrentTab() === "Analyse") {
        // If there are no reg objects, put message and grey out box
        container.style["background-color"] = "lightgrey";
        container.innerText = "Add reg object to show deviation histogram"
    } else {
        container.style["background-color"] = "white";
        container.innerText = "";

        let visObjects = objectsToShow.slice();
        let xData = [];
        let yData = [];

        let scalarMin = document.getElementById("scalarMin").value/1;
        let scalarMax = document.getElementById("scalarMax").value/1;

        function fetchData() {
            if (visObjects.length > 0) {
                xData.push(objects[visObjects[0]].values);
                visObjects.shift();  // Removes first element
                fetchData();
            } else {
                let colours;
                if (getCurrentTab() === "Register") {
                    colours = getColourValues(lookupTable, scalarMin, scalarMax);
                }
                addHistogram(
                    container,
                    "Shape Deviation", "Shape deviation /mm", "density",
                    xData, yData, objectsToShow, scalarMin, scalarMax, numColours, colours
                );
            }
        }
        fetchData();
    }
}
/**
 * Adds a histogram to the container which resizes with it as the screen is resized
 * @param container The container to place the graph into
 * @param title The title displayed on the chart
 * @param xlabel
 * @param ylabel
 * @param xData
 * @param yData
 * @param traceNames
 * @param lowRange
 * @param upperRange
 * @param numBins
 * @param colours If undefined, then default colours are used
 */
function addHistogram(container, title, xlabel, ylabel, xData, yData, traceNames, lowRange, upperRange, numBins, colours) {
    // Enforce odd number of bins
    if (numBins % 2 === 0) {
        numBins += 1;
    }
    let values = [];
    for (let i = 0; i < numBins; i++) {
        values.push(i * (upperRange - lowRange) / numBins + lowRange);
    }

    // Process dataset
    let traces = [];
    for (let i = 0; i < xData.length; i++) {
        traces.push({
            type: 'histogram',
            name: traceNames[i],
            x: xData[i],
            y: yData[i],
            hoverinfo: "y",
            xbins: {
                end: upperRange,
                size: (upperRange - lowRange) / numBins,
                start: lowRange
            },
            marker: {
                cmax: upperRange,
                cmin: lowRange,
                colorbar: {},
                color: values,
                colorscale: colours
            }
        });
    }

    var data = traces;

    let layout = getLayout();
    layout.title = title;
    layout.xaxis.title = {text: xlabel};
    layout.yaxis.title = {text: ylabel};
    layout.margin.b = 80;

    Plotly.newPlot(container, data, layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
    });
}

