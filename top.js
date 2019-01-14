//ランキングのチャート描画オブジェクト
const RankingsChartDrawer = function () {
  this.chart = new google.visualization.ChartWrapper({
    chartType: 'BarChart',
    containerId: 'chart'
  });

  const options = {
    width: 960,
    height: 20000,
    fontSize: 16,
    vAxis: {
      title: '順位',
      textPosition: 'out'
    },
    hAxis: {
      title: 'アクセス数'
    },
    legend: {
      position: 'none'
    },
    chartArea: { width: '80%', left: '20%', height: '99%', top: 10 }
  };
  this.chart.setOptions(options);

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn('string', '順位');
  dataTable.addColumn('number', 'アクセス数');
  dataTable.addColumn({ type: 'number', role: 'annotation' });
  this.chart.setDataTable(dataTable);

  //バーがクリックされたとき、その本の詳細チャートを表示する。
  google.visualization.events.addListener(this.chart, 'select', () => {
    const selection = this.chart.getChart().getSelection();
    if (selection.length == 0) {
      return;
    }
    const selectedRowIndex = selection[0].row;

    const dataTable = this.chart.getDataTable();
    const title = dataTable.getValue(selectedRowIndex, 0);

    // 選択状態を解除する
    // (解除しないと、次に同じバーを選択したときに選択解除扱いになり、行の情報が取得できないため)
    this.chart.getChart().setSelection([]);

    // 本の詳細を表示
    const rankingInfo = getSelectedMonthRankings().find(elem => elem.title == title);

    $('#popup-title').text(rankingInfo.title);
    $('#popup-title').attr('href', rankingInfo.url);
    if (rankingInfo.subtitle != null) {
      $('#popup-subtitle').text(rankingInfo.subtitle);
    } else {
      $('#popup-subtitle').text('')
    }

    //とりあえず一人だけ
    const author = getAuthors(rankingInfo.title)[0];
    $('#popup-authors').text(author.name);
    $('#popup-authors').attr('href', author.url);

    const totalPageView = calcTotalPageView(rankingInfo.title);
    $('#popup-total-pageview').text(totalPageView);
    $('#popup-link').attr('href', rankingInfo.url);

    $('#overlay').fadeIn();
    bookDetailChartDrawer.draw(title);
  });
};

const getAuthors = (title) => {
  for (let monthRanking of monthRankings) {
    for (let rankInfo of monthRanking.rankings) {
      if (rankInfo.title == title) {
        return rankInfo.authors;
      }
    }
  }
}

// タイトルから、そのタイトルの累計のアクセス数を計算する。
const calcTotalPageView = (title) => {
  let totalPageView = 0;
  monthRankings.forEach(element => {
    const rankings = element.rankings;
    const targetData = rankings.find(element => element.title == title);
    totalPageView += targetData.pageview;
  });

  return totalPageView;
}

RankingsChartDrawer.prototype.draw = function (rankings) {
  const dataTable = this.chart.getDataTable();
  const currentNumberOfRows = dataTable.getNumberOfRows();
  dataTable.removeRows(0, currentNumberOfRows);
  rankings.forEach(element => {
    dataTable.addRow([{ v: element.title, f: `${element.rank}.${element.title}` }, element.pageview, element.pageview]);
  });

  const formatter = new google.visualization.ArrowFormat();
  formatter.format(dataTable, 1);

  this.chart.getOption('hAxis').maxValue = rankings[0].pageview + 2000;

  this.chart.draw();
};

//本の詳細のチャート描画オブジェクト
const BookDetailChartDrawer = function () {
  this.chart = new google.visualization.ChartWrapper({
    chartType: 'LineChart',
    containerId: 'detail-chart'
  });

  const options = {
    width: 960,
    height: 400,
    chartArea: { width: '85%', height: '85%' },
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
  this.chart.setOptions(options);

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn('datetime', '対象月');
  dataTable.addColumn('number', 'アクセス数');
  dataTable.addColumn('number', '順位');
  this.chart.setDataTable(dataTable);
};

BookDetailChartDrawer.prototype.draw = function (title) {
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

  const dataTable = this.chart.getDataTable();
  const currentNumberOfRows = dataTable.getNumberOfRows();
  dataTable.removeRows(0, currentNumberOfRows);

  targetWorkRanksPerMonth.forEach(element => {
    const year = parseInt(element.month.split('/')[0]);
    const month = parseInt(element.month.split('/')[1]);
    const date = new Date(year, month);
    dataTable.addRow([date, element.pageview, element.rank]);
  });

  this.chart.draw();
};

//各集計月の集計結果ランキングを格納する
let monthRankings;
//ランキングのチャート描画オブジェクトを格納する
let rankingsChartDrawer;
//本の詳細のチャート描画オブジェクトを格納する
let bookDetailChartDrawer;

$(function () {
  google.charts.load('current', { 'packages': ['corechart', 'controls'] });
  google.charts.setOnLoadCallback(initialize);

  function initialize() {
    $.get('resources/rankings.json').done((result) => {
      monthRankings = result;
      const selectedMonthRankings = getSelectedMonthRankings();
      rankingsChartDrawer = new RankingsChartDrawer();
      rankingsChartDrawer.draw(selectedMonthRankings);

      bookDetailChartDrawer = new BookDetailChartDrawer();
    });
  };

  $('#year,#month').change(function () {
    const selectedMonthRankings = getSelectedMonthRankings();
    rankingsChartDrawer.draw(selectedMonthRankings);
  });

  $('#overlay').click(function (e) {
    const target = e.target;
    if (target.id === 'overlay') {
      $(this).fadeOut();
    }
  });
});

const getSelectedMonthRankings = () => {
  const yearStr = $('#year').val();
  const monthStr = $('#month').val();

  const selectedMonth = `${yearStr}/${monthStr}`;
  const selectedMonthRankings = monthRankings.filter(rankings => rankings.month == selectedMonth)[0].rankings;

  return selectedMonthRankings;
}