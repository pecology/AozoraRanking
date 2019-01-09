const ChartDrawer = function () {
  const options = {
    'width': 960,
    'height': 20000,
    fontSize: 16,
    vAxis: {
      title: 'rank',
      textPosition: 'out'
    },
    hAxis: {
      title: 'pageview',
      //maxValue: rankings[0].pageview + 2000
    },
    legend: {
      position: 'none'
    },
    'chartArea': { 'width': '80%', 'left': '20%', 'height': '99%', top: 10 }
  };

  this.chart = new google.visualization.ChartWrapper({
    chartType: 'BarChart',
    containerId: 'chart',
    options: options
  });
  
  google.visualization.events.addListener(this.chart, 'select', () => {
    const selection = this.chart.getChart().getSelection()[0];
    const dataTable = this.chart.getDataTable();
    const title = dataTable.getValue(selection.row, 0);

    $('#overlay').show();
    drawDetailChart(title);
  });
}

ChartDrawer.prototype.draw = function (rankings) {
  // if(this.chart != null) {
  //   this.chart.clearChart();
  //   this.chart = null;
  // }

  const data = new google.visualization.DataTable();
  data.addColumn('string', 'rankAndTitle');
  data.addColumn('number', 'pageview');
  data.addColumn({ type: 'number', role: 'annotation' });

  rankings.forEach(element => {
    data.addRow([{v: element.title, f: `${element.rank}.${element.title}`}, element.pageview, element.pageview]);
  });

  const formatter = new google.visualization.ArrowFormat();
  formatter.format(data, 1); 

  this.chart.setDataTable(data);
  this.chart.draw();
}

const drawDetailChart = (title) => {
  const targetWorkRanksPerMonth = monthRankings.map(element => {
    const returnElement = {};
    returnElement.month = element.month;

    const targetRank = element.rankings.find(ranking => ranking.title == title);

    if (targetRank !== undefined) {
      returnElement.rank = targetRank.rank;
      returnElement.pageview = targetRank.pageview;
    }

    return returnElement;
  });

  const data = new google.visualization.DataTable();
  data.addColumn('string', 'month');
  data.addColumn('number', 'pageview');
  data.addColumn('number', 'rank');

  targetWorkRanksPerMonth.forEach(element => {
    data.addRow([element.month, element.pageview, element.rank]);
  });

  const options = {
    width: 940,
    height: 300,
    series: {
      0: { targetAxisIndex: 0 },
      1: { targetAxisIndex: 1 }
    },
    vAxes: {
      1: {
        direction: -1,
        maxValue: 50
      }
    }
  };

  this.chart = new google.visualization.ChartWrapper({
    chartType: 'LineChart',
    containerId: 'detail-chart',
    options: options,
    dataTable: data
  });

  this.chart.draw();
}

let monthRankings;
let chartDrawer;

$(function () {
  google.charts.load('current', { 'packages': ['corechart', 'controls'] });
  google.charts.setOnLoadCallback(initialize);

  function initialize() {
    $.get('resources/rankings.json').done((result) => {
      monthRankings = result;

      const selectedMonthRankings = getSelectedMonthRankings();
      chartDrawer = new ChartDrawer();
      chartDrawer.draw(selectedMonthRankings);
    });
  };


  $('#year,#month').change(function () {
    const selectedMonthRankings = getSelectedMonthRankings();
    chartDrawer.draw(selectedMonthRankings);
  });

  $('#overlay').click(function (e) {
    const target = e.target;
    if (target.id === 'overlay') {
      $(this).hide();
    }
  });

  $('#detail-button').click(function () {
    $('#overlay').show();
    drawDetailChart('こころ');
  });

  const getSelectedMonthRankings = () => {
    const yearStr = $('#year').val();
    const monthStr = $('#month').val();

    const selectedMonth = `${yearStr}/${monthStr}`;
    const selectedMonthRankings = monthRankings.filter(rankings => rankings.month == selectedMonth)[0].rankings;

    return selectedMonthRankings;
  }
});
