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


function fetchCSAData(session_id1, objID, callback) {
    if (objects[objID] !== undefined) {
        const formData = new FormData();
        formData.append("session", session_id1);
        formData.append("objID", objID);

        fetch("analyse/csa", {
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

function fetchCSAGraph() {

    fetchCSAData(session_id, getRegistrationTarget(), function (xData, yData) {
        let xData1 = xData;
        let yData1 = yData;
        fetchCSAData(session_id, getRegistrationBaseline(), function (xData, yData) {
            let xData2 = xData;
            let yData2 = yData;
            addLineGraph("csaGraphReg", "Cross Section Area", "Length /%", "Area /cm^2",
                [xData1, xData2], [yData1, yData2], [getRegistrationTarget(), getRegistrationBaseline()]);
        });
    });
}


/**
 * Adds a histogram to the container which resizes with it as the screen is resized
 * @param container The container to place the graph into
 * @param title The title displayed on the chart
 * @param xlabel
 * @param ylabel
 * @param xData
 * @param yData
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