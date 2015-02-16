var chart = d3.select('#reservoirs');

var things = chart.selectAll('circle.thing');
var thingsdata = [];

var xScale = d3.scale.linear()
  .domain([-150,-100])
  .range([100,300]);
var yScale = d3.scale.linear()
  .domain([20,40])
  .range([250,50]);

oboe('./data/station_data.json')
  .node('stations.*{storage}', function(thing) {
    thingsdata.push(thing);

    var dt = things.data(thingsdata);

    dt.enter().append('svg:circle')
      .classed('thing', true)
      .attr('cx', function(d) { return xScale(d.Longitude); })
      .attr('cy', function(d) { return yScale(d.Latitude); })
      .attr('r', 1);
  });
