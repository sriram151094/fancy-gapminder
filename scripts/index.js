const margin = { top: 50, right: 50, bottom: 80, left: 80 };
const width = 1400 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;


var fullData;
var svg;
var xScale;
var yScale;

var x_attribute
var y_attribute
var attrMaxValues

var attributes = ['population', 'lifeexpectancy', 'mortality', 'gdp']

var ticksMap = new Map()
ticksMap.set(attributes[0], function (d) { return d / 1000000; })
ticksMap.set(attributes[3], function (d) { return d / 1000000; })
ticksMap.set(attributes[2], function (d) { return d; })
ticksMap.set(attributes[1], function (d) { return d; })

var axesLabelMap = new Map()
axesLabelMap.set(attributes[0], 'Population total in Million')
axesLabelMap.set(attributes[1], 'Life expectancy in years')
axesLabelMap.set(attributes[2], 'Child Mortality (0-5 years) per 1000 born')
axesLabelMap.set(attributes[3], 'Total GDP in USD (Inflation adjusted)')

var regions = ['South Asia',
    'Europe & Central Asia',
    'Middle East & North Africa',
    'Sub-Saharan Africa',
    'Latin America & Caribbean',
    'East Asia & Pacific',
    'North America']
var regionColorMap = new Map()

// Assigning a specific color for each region
for (let i = 0; i < regions.length; i++) {
    regionColorMap.set(regions[i], d3.schemeSet2[i])
}



loadData();

// On load of the page import the wrangled data.json file
function loadData() {
    d3.json("data/data.json").then(data => {
        fullData = data;
        console.log(fullData);

        // Get the maximum value for all the four attributes
        attrMaxValues = data['stats']

        console.log(attrMaxValues)

        draw(true);
    })

    d3.select("#year-input").on('change', function () {
        draw(false);
    })

    d3.select("#region").on('change', function () {
        draw(true);
    })

    d3.select('#x-attr-select').on('change', function () {
        draw(true);
    })

    d3.select('#y-attr-select').on('change', function () {
        draw(true);
    })

}


function draw(drawaxis) {
    scatterPlot().then(res => {
        console.log("Scatter polot function resolve " + res)
        if (drawaxis == true) {
            drawAxes(x_attribute, y_attribute).then(res => {
                console.log("Call draw axes function status " + res);
            })
        }
    });
}


function scatterPlot() {

    return new Promise((resolve, reject) => {
        d3.selectAll('#scatter').remove()

        var filtered_data
        svg = d3.select('#scatterPlot')
        year = d3.select('#year-input').property('value')
        x_attribute = d3.select('#x-attr-select').property('value')
        y_attribute = d3.select('#y-attr-select').property('value')

        // Get the value of the region
        regionSelection = d3.select('#region').property('value')

        if (regionSelection < 7) {
            region = regions[regionSelection]
            filtered_data = fullData[year][region]
            filtered_data.forEach(data => data.color = regionColorMap.get(region))
        }
        else {
            filtered_data = []

            for (let i = 0; i < regions.length; i++) {
                let t = fullData[year][regions[i]]
                for (let j = 0; j < t.length; j++) {
                    t[j].color = regionColorMap.get(regions[i])
                    filtered_data.push(t[j])
                }
            }

            console.log(filtered_data)
        }


        xScale = d3.scaleLinear()
            .domain([0, attrMaxValues[x_attribute]])
            .range([0, width])

        yScale = d3.scaleLinear()
            .domain([0, attrMaxValues[y_attribute]])
            .range([height, 0])

        svg.append("g")
            .attr('id', 'scatter')

        var radius = 20
        svg = d3.select('#scatter')
        const circles = svg.selectAll("dot")
            .data(filtered_data)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return xScale(+d.data[x_attribute]); })
            .attr("cy", function (d) { return yScale(+d.data[y_attribute]); })
            .attr("transform", "translate(" + (margin.left + radius + 5) + "," + (margin.top - radius - 5) + ")")
            .attr("r", radius)
            .style("fill", d => d.color)

        const labels = svg.append('g')
            .selectAll('text')
            .data(filtered_data)
            .join('text')
            .attr('x', function (d) { return xScale(+d.data[x_attribute]); })
            .attr('y', function (d) { return yScale(+d.data[y_attribute]); })
            .attr('dx', '-12')
            .attr('dy', '5')
            .attr('transform', "translate(" + (margin.left + radius + 5) + "," + (margin.top - radius - 5) + ")")
            .text(d => d.geo)

        resolve(true);

    })

}


function drawAxes(x_attribute, y_attribute) {
    return new Promise((resolve, reject) => {

        d3.selectAll('#x-axis').remove()
        d3.selectAll('#y-axis').remove()
        d3.selectAll('#axisLabel').remove()

        svg = d3.select("#scatterPlot")

        // Draw X-Axis
        const xAxis = d3.axisBottom(xScale);
        xAxis.ticks(10)
            .tickFormat(ticksMap.get(x_attribute)); // Get the tick-format function based on attribute

        svg.append("g")
            .attr("id", "x-axis")
            .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
            .call(xAxis);

        // Draw Y-Axis
        const yAxis = d3.axisLeft(yScale);
        yAxis.tickFormat(ticksMap.get(y_attribute))
        svg.append("g")
            .attr("id", "y-axis")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(yAxis);


        // Append X-axis label
        svg.append('text')
            .attr('id', 'axisLabel')
            .attr("transform", "translate(" + (width / 2) + "," + (height + margin.top + 50) + ")")
            .text(axesLabelMap.get(x_attribute))


        // Append Y-axis label
        svg.append('text')
            .attr('id', 'axisLabel')
            .attr("transform", "translate(" + (margin.left - 60) + "," + (height - margin.top - margin.bottom - 50) + ") rotate(-90)")
            .text(axesLabelMap.get(y_attribute))

        resolve("Success")
    })
}