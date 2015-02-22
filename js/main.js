function getTransformString(x, y, css) {
  return 'translate('+(x || 0)+(css ? 'px' : '')+','+(y || 0)+(css ? 'px' : '')+')';
}

var chart = d3.select('#reservoirs');

var things = chart.selectAll('circle.thing');
var thingsdata = [];

// month 0 is going to be January 1916 (for now)
var startYear = 1916;
var yearsScale = d3.scale.linear()
  .domain([startYear, startYear + 100])
  .range([100,940]);
var fillScale = d3.scale.linear()
  .domain([0,1])
  .range([0,15]);
var fillScaleCleaned = function(value) {
  // console.log('value', value, fillScale(value));
  if(typeof value != 'number' || isNaN(value)) { return 0; }
  return fillScale(value);
};
var fillColorScale = chroma.scale([ '#B13631', '#2368A0' ])
  .domain([0,1]);
var fillColorScaleCleaned = function(value) {
  if(typeof value != 'number' || isNaN(value)) { return '#B7B4B4'; }
  return fillColorScale(value);
};
// month 0 is going to be January 1990
var monthStart = 1990;
var monthsScale = d3.scale.linear()
  .domain([0,(2015 - monthStart) * 12])
  .range([200,940]);

function dateNumberToMonth(dateNumber, start) {
  start = start === undefined ? startYear : start;
  var dateString = dateNumber.toString();
  var year = parseInt(dateNumber.substr(0,4), 10);
  var month = parseInt(dateNumber.substr(4,2), 10) - 1;

  return (year - start) * 12 + month;
}

var mainFsm = new machina.Fsm({
  initialize : function() {
    _.bindAll(this, 'addPoint');

    this.chart = d3.select('#reservoirs');

    this.data = [];

    this.loadData();
  },
  loadData : function() {
    var self=this;
    console.log('loading data');
    this.loader = oboe('./data/station_data.json');
    this.loader.node('stations.*{storage}', this.addPoint);
  },
  addPoint : function(datum) {
    var yearValues = {};
    _.each(datum.storage, function(i) {
      var year = i.date.toString().substr(0,4);
      if(!yearValues[year]) { yearValues[year] = []; }
      // we're guarding against those 'm' values here...
      if(typeof i.value === 'number') { yearValues[year].push(i.value); }
    });
    datum.years = _.map(yearValues, function(v,k) {
      return {
        year : k,
        value : _.reduce(v, function(memo, value) { return memo + value; }) / v.length
      };
    });

    this.data.push(datum);

    this.binding = chart.selectAll('g.reservoir').data(this.data);
    this.latitudeSort = _.sortBy(this.data, function(n) { return -n.Latitude; });

    this.render();
  },
  render : function() {
    var self = this;

    var goneGroups = this.binding.exit().remove();

    var newGroups = this.binding.enter().append('svg:g')
      .classed('reservoir', true);

    newGroups.append('svg:text')
      .classed('reservoir-name', true)
      .attr('y', 15)
      .text(function(d) { return d['Station Name']; });

    newGroups.each(function(d) {
      var group = d3.select(this);
      var data = _.filter(d.storage, function(i) {
        return parseInt(i.date.toString().substr(0,4), 10) >= monthStart;
      });
      var selection = group.selectAll('rect.month-block').data(data);
      // fix this in python...
      var capacity = parseInt(d['Capacity (AF)'].split(',').join(''), 10);

      selection.enter().append('svg:rect')
        .classed('month-block', true)
        .attr('height', function(item) {
          return fillScaleCleaned(item.value/capacity);
        })
        .attr('y', function(item) {
          return 15 - fillScaleCleaned(item.value/capacity);
        })
        .attr('width', monthsScale(1) - monthsScale(0))
        .attr('x', function(item) {
          return monthsScale(dateNumberToMonth(item.date, monthStart));
        })
        .attr('fill', function(item) { return fillColorScaleCleaned(item.value/capacity); });
    });

    this.binding
      .attr('transform', function(d) {
        return getTransformString(0, self.latitudeSort.indexOf(d)*20);
      });

    this.chart.attr('height', this.data.length * 20);
  }
});
