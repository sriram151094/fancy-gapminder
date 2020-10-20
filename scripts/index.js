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
var attributes = ['population', 'lifeexpectancy', 'mortality', 'gdp']
var moving = false
var label

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
        svg = d3.select('#scatterPlot')
        svg.append("g")
            .attr('id', 'scatter')

        label = svg.append('text')
            .attr('id', 'yearBg')
            .attr('transform', 'translate(' + (width / 2 - 200) + ',' + (height / 2 + 100) + ')')
            .attr('fill', 'gray')
            .attr('opacity', '0.4')
            .style('font-size', 200)
            .text(1800)
        draw(true);
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
        clearInterval(updateYear)
        startSlider();
    }
    else {
        clearInterval(updateYear)
        moving = false
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
    }

}

function updateDataOnYearChange() {
    new_data = []
    if (regionSelection < 7) {
        region = regions[regionSelection]
        new_data = fullData[year][region]
    }
    else {
        for (let i = 0; i < regions.length; i++) {
            let t = fullData[year][regions[i]]
            for (let j = 0; j < t.length; j++) {
                new_data.push(t[j])
            }
        }
    }

    for (let i = 0; i < filtered_data.length; i++) {
        filtered_data[i].data[x_attribute] = new_data[i].data[x_attribute]
        filtered_data[i].data[y_attribute] = new_data[i].data[y_attribute]
    }
}


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
            for (let i = 0; i < regions.length; i++) {
                let t = fullData[year][regions[i]]
                for (let j = 0; j < t.length; j++) {
                    t[j].color = regionColorMap.get(regions[i])
                    filtered_data.push(t[j])
                }
            }
        }

        console.log(filtered_data)

        xScale = d3.scaleLinear()
            .domain([0, attrMaxValues[x_attribute]])
            .range([0, width])

        yScale = d3.scaleLinear()
            .domain([0, attrMaxValues[y_attribute]])
            .range([height, 0])

        var radius = 20
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
    var radius = 20
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
    var radius = 20
    enter.append('g')
        .attr("transform", "translate(" + (margin.left + radius + 5) + "," + (margin.top - radius - 5) + ")")
        .call(
            g => g.append('circle')
                .transition(d3.transition().duration(2500))
                .attr("cx", function (d) { return xScale(+d.data[x_attribute]); })
                .attr("cy", function (d) { return yScale(+d.data[y_attribute]); })
                .attr("r", radius)
                .style("fill", d => d.color)
        )
        .call(
            g => g.append('text')
                .style('opacity', 0)
                .transition(d3.transition().duration(2500))
                .attr('x', function (d) { return xScale(+d.data[x_attribute]); })
                .attr('y', function (d) { return yScale(+d.data[y_attribute]); })
                .attr('dx', '-12')
                .attr('dy', '5')
                .text(d => d.geo)
                .transition(d3.transition().duration(10))
                .style('opacity', 2)
        )
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