const ChartDrawer = function(){
  this.chart = null;
}

ChartDrawer.prototype.draw = function(rankings){
  // if(this.chart != null) {
  //   this.chart.clearChart();
  //   this.chart = null;
  // }

  const data =  new google.visualization.DataTable();
  data.addColumn('string', 'rankAndTitle');
  data.addColumn('number', 'pageview');
  data.addColumn({type:'number', role:'annotation'});

  rankings.forEach(element => {
    data.addRow([`${element.rank}.${element.title}`, element.pageview, element.pageview]);
  });
  
  const options = {'width': 960,
                   'height': 20000,
                   fontSize: 16,
                   vAxis:{
                     title: 'rank',
                     textPosition: 'out'
                   },
                   hAxis:{
                     title: 'pageview',
                     maxValue: rankings[0].pageview + 2000
                   },
                   legend: {
                     position: 'none'
                   },
                   'chartArea': {'width': '80%', 'left': '20%', 'height': '99%', top: 10}
                  };

  this.chart = new google.visualization.ChartWrapper({
    chartType: 'BarChart',
    containerId: 'chart',
    options: options,
    dataTable: data
  });

  this.chart.draw();
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

  $('#year,#month').change(function(){
    const yearStr = $('#year').val();
    const monthStr = $('#month').val();
    
    const selectedMonth = `${yearStr}/${monthStr}`;
    const selectedMonthRankings = monthRankings.filter(rankings => rankings.month == selectedMonth)[0].rankings;
    chartDrawer.draw(selectedMonthRankings, 0);
  })
});
