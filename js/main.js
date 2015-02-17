function getTransformString(x, y, css) {
  return 'translate('+(x || 0)+(css ? 'px' : '')+','+(y || 0)+(css ? 'px' : '')+')';
}

var chart = d3.select('#reservoirs');

var things = chart.selectAll('circle.thing');
var thingsdata = [];

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
    this.loader.done(function() {
      console.log("done!", self.data.length);
      console.log(document.querySelectorAll('.reservoir').length);
    });
  },
  addPoint : function(datum) {
    this.data.push(datum);

    this.binding = chart.selectAll('g.reservoir').data(this.data);

    this.render();
  },
  render : function() {
    var goneGroups = this.binding.exit().remove();

    var newGroups = this.binding.enter().append('svg:g')
      .classed('reservoir', true);

    newGroups.append('svg:text')
      .classed('reservoir-name', true)
      .text(function(d) { return d['Station Name']; });

    this.binding
      .attr('transform', function(d, i) {
        return getTransformString(0, i*20);
      });

    this.chart.attr('height', this.data.length * 20);
  }
});
