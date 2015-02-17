function getTransformString(x, y, css) {
  return 'translate('+(x || 0)+(css ? 'px' : '')+','+(y || 0)+(css ? 'px' : '')+')';
}

var chart = d3.select('#reservoirs');

var things = chart.selectAll('circle.thing');
var thingsdata = [];

// month 0 is going to be January 1916 (for now)
var startYear = 1916;
var monthsScale = d3.scale.linear()
  .domain([0,100 * 12])
  .range([100,940]);
var yearsScale = d3.scale.linear()
  .domain([startYear, startYear + 100])
  .range([100,940]);
var fillScale = d3.scale.linear()
  .domain([0,1])
  .range([0,15]);

function dateNumberToMonth(dateNumber) {
  var dateString = dateNumber.toString();
  var year = parseInt(dateNumber.substr(0,4), 10);
  var month = parseInt(dateNumber.substr(4,2), 10) - 1;

  return (year - startYear) * 12 + month;
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
      console.log(d);
      var group = d3.select(this);
      var selection = group.selectAll('rect.month-block').data(d.years);
      // fix this in python...
      var capacity = parseInt(d['Capacity (AF)'].split(',').join(''), 10);

      selection.enter().append('svg:rect')
        .classed('month-block', true)
        .attr('height', function(y) {
          return fillScale(y.value/capacity);
        })
        .attr('y', function(y) {
          return 15 - fillScale(y.value/capacity);
        })
        .attr('width', yearsScale(1) - yearsScale(0))
        .attr('x', function(y) {
          return yearsScale(y.year);
        });
    });

    this.binding
      .attr('transform', function(d) {
        return getTransformString(0, self.latitudeSort.indexOf(d)*20);
      });

    this.chart.attr('height', this.data.length * 20);
  }
});
