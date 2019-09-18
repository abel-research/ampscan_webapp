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


/**
 * Adds a histogram to the container which resizes with it as the screen is resized
 * @param container The container to place the graph into
 * @param title The title displayed on the chart
 * @param xlabel
 * @param ylabel
 * @param dataset List of pairs corresponding to points on graph. May also be object mapping key to values.
 */
function addHistogram(container, title, xlabel, ylabel, dataset) {

    // Process dataset
    let d = extractData(dataset);
    let xData = d[0];
    let yData = d[1];

    var trace1 = {
        type: 'bar',
        x: xData,
        y: yData,
        marker: {
            line: {
                width: 0,
                color: '#595959',
            },
            color: '#62BDC2',
        },
        // This doesn't work
        hovertext: {
            font: {
                family: "Lato, sans-serif",
                size: 18,
                color: "#ffffff",
            }
        },
        //Only display trace on hover for y axis
        hoverinfo:"y"
    };

    var data = [trace1];

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