const ChartDrawer = function(){
  this.chart = null;
}

ChartDrawer.prototype.draw = function(rankings, pagingIndex){
  if(this.chart != null) {
    this.chart.clearChart();
    this.chart = null;
  }

  const data =  new google.visualization.DataTable();
  data.addColumn('number', 'rank');
  data.addColumn('number', 'pageview');

  rankings.forEach(element => {
    data.addRow([element.rank, element.pageview]);
  });
  
  const options = {'width': 960,
                   'height': 600,
                   vAxis:{
                     title: 'pageview',
                     maxValue: rankings[0].pageview
                   },
                   hAxis:{
                     title: 'rank',
                     gridlines: {
                      color: '#ddd', count: 10
                     },
                     minorGridlines: {
                      color: '#fff'
                     }
                   },
                   legend: {
                     position: 'none'
                   },
                   'chartArea': {'width': '80%', 'height': '80%'}
                  };

  this.chart = new google.visualization.ChartWrapper({
    chartType: 'ColumnChart',
    containerId: 'chart',
    options: options
  });

  this.filter = new google.visualization.ControlWrapper({
    'controlType': 'ChartRangeFilter',
    'containerId': 'filter',
    'options': {
      filterColumnIndex: 0,
      ui: {
        chartOptions: {
          width: 960,
          height: 50,
        },
        minRangeSize: 10,
        snapToData: true
      }
    },
    state: {
      range: {
        start: 1,
        end: 11
      } 
    }
  });

  this.dashboard = new google.visualization.Dashboard(document.getElementById('dashboard'));
  this.dashboard.bind(this.filter, this.chart);
  this.dashboard.draw(data);
}

// Arrayを指定された要素数で分割したときの、index番目のArrayを取得する
// unitSize: 指定された要素数
// indexは0から始まる
const getPagingData = (targetArray, index, unitSize) => {
  const start = index * unitSize;
  const end = start + unitSize;

  return targetArray.slice(start, end);
}

let monthRankings;
const chartDrawer = new ChartDrawer();

$(function(){
  google.charts.load('current', {'packages':['corechart', 'controls']});
  google.charts.setOnLoadCallback(initialize);

  function initialize() {
    $.get('resources/rankings.json').done((result) => {
      monthRankings = result;

      const currentMonthRankings = monthRankings[monthRankings.length - 1].rankings;
      chartDrawer.draw(currentMonthRankings, 0);
    });
  };
});
