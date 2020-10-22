const margin = { top: 50, right: 50, bottom: 80, left: 80 };
const width = 1400 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;


var fullData;
var svg;
var xScale;
var yScale;

var x_attribute
var y_attribute
var regionSelection
var attrMaxValues
var filtered_data = []

var UUID
var attributes = ['population', 'lifeexpectancy', 'mortality', 'gdp', 'fertility']
var moving = false
var label
var radius = 20

var ticksMap = new Map()
ticksMap.set(attributes[0], function (d) { return d / 1000000; })
ticksMap.set(attributes[3], function (d) { return d / 1000000; })
ticksMap.set(attributes[2], function (d) { return d; })
ticksMap.set(attributes[1], function (d) { return d; })
ticksMap.set(attributes[4], function (d) { return d; })

var axesLabelMap = new Map()
axesLabelMap.set(attributes[0], 'Population total in Million')
axesLabelMap.set(attributes[1], 'Life expectancy in years')
axesLabelMap.set(attributes[2], 'Child Mortality (0-5 years) per 1000 born')
axesLabelMap.set(attributes[3], 'Total GDP in USD in million (Inflation adjusted)')
axesLabelMap.set(attributes[4], 'Total fertility (Children per woman)')

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
        svg = d3.select('#scatterPlot')

        label = svg.append('text')
        .attr('id', 'yearBg')
        .attr('transform', 'translate(' + (width / 2 - 200) + ',' + (height / 2 + 100) + ')')
        .attr('fill', 'gray')
        .attr('opacity', '0.4')
        .style('font-size', 200)
        .text(1800)

        // Create a g element for scatter plot
        svg.append("g")
            .attr('id', 'scatter')

        // Create a g-element for polyline    
        svg.append("g")
            .attr('id', 'poly-line')

      

        // Add tooltip          
        toolTip = d3.select("body").append("div")
            .attr("class", "tooltip")
        draw(true);

        d3.select('#play-button').classed('play', !moving)
    })

    d3.select("#year-input").on('change', function () {
        draw(false);
        let year = d3.select('#year-input').property('value')
        label.text((year))
        //updateDataOnYearChange();
    })

    d3.select("#region").on('change', function () {
        draw(false);
    })

    d3.select('#x-attr-select').on('change', function () {
        draw(true);
    })

    d3.select('#y-attr-select').on('change', function () {
        draw(true);
    })
}

function handlePlayBtnClick() {
    let toggle = d3.select('#play-button').property('value');

    // Animation slider starts

    d3.select('#play-button').property('value', toggle == 'Play' ? 'Pause' : 'Play');

    if (toggle == 'Play') {
        moving = true
        d3.select('#play-button').classed('play', !moving)
        d3.select('#play-button').classed('paused', moving)
        clearInterval(updateYear)
        startSlider();
    }
    else {
        clearInterval(updateYear)
        moving = false
        d3.select('#play-button').classed('play', !moving)
        d3.select('#play-button').classed('paused', moving)
    }
}

function startSlider() {
    setInterval(updateYear, 1000);
}

function updateYear() {
    let year = +d3.select("#year-input").property('value')
    if (moving == true && year < 2100) {
        console.log(year)
        label.text((year + 1).toString())
        d3.select("#year-input").property('value', (year + 1).toString())
        draw(false)
    }
    else {
        moving = false
        clearInterval(updateYear)
        d3.select('#play-button').property('value', 'Play');
        d3.select('#play-button').classed('play', !moving)
        d3.select('#play-button').classed('paused', moving)
    }

}

// function updateDataOnYearChange() {
//     new_data = []
//     if (regionSelection < 7) {
//         region = regions[regionSelection]
//         new_data = fullData[year][region]
//     }
//     else {
//         for (let i = 0; i < regions.length; i++) {
//             let t = fullData[year][regions[i]]
//             for (let j = 0; j < t.length; j++) {
//                 new_data.push(t[j])
//             }
//         }
//     }

//     for (let i = 0; i < filtered_data.length; i++) {
//         filtered_data[i].data[x_attribute] = new_data[i].data[x_attribute]
//         filtered_data[i].data[y_attribute] = new_data[i].data[y_attribute]
//     }
// }


function draw(drawaxis) {
    scatterPlot().then(res => {
        console.log("Scatter plot function resolve " + res)
        if (drawaxis == true) {
            drawAxes(x_attribute, y_attribute).then(res => {
                console.log("Call draw axes function status " + res);
            })
        }
    });
}


function checkOutliers(data) {
    if (data[x_attribute] == "undefined" || data[y_attribute] == "undefined" || data[x_attribute] == "NaN"
        || data[y_attribute] == "NaN")
        return false;
    return true;
}

function scatterPlot() {

    return new Promise((resolve, reject) => {

        svg = d3.select('#scatterPlot')
        year = d3.select('#year-input').property('value')
        x_attribute = d3.select('#x-attr-select').property('value')
        y_attribute = d3.select('#y-attr-select').property('value')

        // Get the value of the region
        regionSelection = d3.select('#region').property('value')

        if (regionSelection < 7) {
            region = regions[regionSelection]
            new_data = fullData[year][region]
            filtered_data = new_data.filter(row => checkOutliers(row.data))
            filtered_data.forEach(data => data.color = regionColorMap.get(region))
        }
        else {
            filtered_data = []
            let new_data = []
            for (let i = 0; i < regions.length; i++) {
                let t = fullData[year][regions[i]]
                for (let j = 0; j < t.length; j++) {
                    t[j].color = regionColorMap.get(regions[i])
                    new_data.push(t[j])
                }
            }
            filtered_data = new_data.filter(row => checkOutliers(row.data))
        }

        console.log(filtered_data)

        xScale = d3.scaleLinear()
            .domain([0, attrMaxValues[x_attribute]])
            .range([0, width])

        yScale = d3.scaleLinear()
            .domain([0, attrMaxValues[y_attribute]])
            .range([height, 0])

        svg = d3.select('#scatter')

        // let UUID = create_UUID()
        // console.log(UUID)
        const countries = svg.selectAll('g')
            .data(filtered_data, d => year + d.geo + x_attribute + y_attribute)
            .join(
                enter => addCirclesAndText(enter),
                update => updateData(update),
                exit => exitData(exit)
            )

        resolve(true);

    })

}

function updateData(update) {
    console.log("Update==========================")
    console.log(update)
    update.call(
        g => g.transition(d3.transition().duration(1000))
            .select('circle')
            .attr("cx", function (d) { return xScale(+d.data[x_attribute]); })
            .attr("cy", function (d) { return yScale(+d.data[y_attribute]); })
            .attr("r", radius)
            .style("fill", d => d.color)
    )
        .call(
            g => g.transition(d3.transition().duration(1000))
                .select('text')
                .attr('x', function (d) { return xScale(+d.data[x_attribute]); })
                .attr('y', function (d) { return yScale(+d.data[y_attribute]); })
                .attr('dx', '-12')
                .attr('dy', '5')
                .text(d => d.geo)
        )
}

function exitData(exit) {
    console.log("Exit============================")
    console.log(exit)
    exit.call(
        g => g.transition(d3.transition().duration(1000))
            .select('circle')
            .style('opacity', 0)
            .remove()
    )
        .call(
            g => g.transition(d3.transition().duration(1000))
                .select('text')
                .style('opacity', 0)
                .remove()
        ).call(
            g => g.transition(d3.transition().duration(1000))
                .remove()
        )
}


function addCirclesAndText(enter) {
    console.log("Enter============================")
    console.log(enter)
    enter.append('g')
        .attr("transform", "translate(" + (margin.left + radius + 5) + "," + (margin.top - radius - 5) + ")")
        .call(
            g => g.append('circle')
                .transition(d3.transition().duration(2000))
                .attr("cx", function (d) { return xScale(+d.data[x_attribute]); })
                .attr("cy", function (d) { return yScale(+d.data[y_attribute]); })
                .attr("r", radius)
                .style("fill", d => d.color)
        )
        .call(
            g => g.append('text')
                .style('opacity', 0)
                .transition(d3.transition().duration(2000))
                .attr('x', function (d) { return xScale(+d.data[x_attribute]); })
                .attr('y', function (d) { return yScale(+d.data[y_attribute]); })
                .attr('dx', '-12')
                .attr('dy', '5')
                .style('opacity', 2)
                .text(d => d.geo)
            // .transition(d3.transition().duration(10))
            // .style('opacity', 2)
        ).call(g => g.on('mouseover', d => drawTooltip(d))
            .on('mouseout', () => { removeTooltip(); removePolyline(); }))
}


function drawTooltip(data) {
    toolTip.transition()
        .duration(50)
        .style("opacity", 1);
    toolTip.html("Country: " + data.country)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px")
        .style("text-align", "left");

    drawPolyLine(data);
}

function removeTooltip() {
    toolTip.transition()
        .duration('50')
        .style("opacity", 0)
}


function drawPolyLine(countryData) {
    console.log(countryData)

    getAllDataForCountry(countryData.geo, countryData.region).then(res => {
        console.log(res)
        removePolyline()
        let line = d3.line()
            .x(function (d) {
                return (d.data[x_attribute] == "undefined" || d.data[x_attribute] == "NaN") ? xScale(0) : xScale(+d.data[x_attribute]);
            })
            .y(function (d) {
                return (d.data[y_attribute] == "undefined" || d.data[y_attribute] == "NaN") ? yScale(0) : yScale(+d.data[y_attribute]);
            })

        let polyline = d3.select('#poly-line')
        polyline.append("path")
            .datum(res)
            .attr("class", "line")
            .attr("id", "line-path")
            .attr("transform", "translate(" + (margin.left + radius + 5) + "," + (margin.top - radius - 5) + ")")
            .attr("fill", "none")
            .attr("d", line);
    })
}

function getAllDataForCountry(countrycode, region) {

    return new Promise((resolve, reject) => {
        let country_range_data = []
        for (let i = 1800; i <= 2100; i++) {
            let t = fullData[i][region].filter(d => d.geo == countrycode)

            if (t.length > 0)
                country_range_data[i - 1800] = t[0]
        }
        resolve(country_range_data)
    })

}

function removePolyline() {
    d3.selectAll('#line-path').remove()
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

function create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}