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
  google.visualization.events.addListener(this.chart, 'select', async () => {
    const selection = this.chart.getChart().getSelection();
    if (selection.length == 0) {
      return;
    }
    const selectedRowIndex = selection[0].row;

    const dataTable = this.chart.getDataTable();

    // 選択状態を解除する
    // (解除しないと、次に同じバーを選択したときに選択解除扱いになり、行の情報が取得できないため)
    this.chart.getChart().setSelection([]);

    // 本の詳細を表示
    //const rankingInfo = fetchSelectedMonthlyRanking().find(elem => elem.title == title);
    const bookId = dataTable.getRowProperty(selectedRowIndex, 'bookId');
    const book = await fetchBookById(bookId);

    $('#popup-title-text').text(book.title);
    $('#popup-title').attr('href', book.url);
    if (book.subtitle != null) {
      $('#popup-subtitle-text').text(book.subtitle);
    } else {
      $('#popup-subtitle-text').text('')
    }

    //とりあえず一人だけ
    const author = await fetchAuthorById(book.authorIds[0]);
    $('#popup-authors').text(author.name);
    $('#popup-authors').attr('href', author.url);

    // 累計アクセス数
    const totalPageView = calcTotalPageView(book);
    $('#popup-total-pageview').text(totalPageView);
    $('#popup-link').attr('href', book.url);

    //平均順位
    const ranks = Object.values(book.monthlyRankingHistories)
      .map(e => e.rank);
    const averageRank = ranks.reduce((accumulator, currentValue) => accumulator + currentValue) / ranks.length;
    $('#popup-average-rank').text(Math.roundCuntom(averageRank, 2));

    $('#overlay').fadeIn();
    bookDetailChartDrawer.draw(book);
  });
};

// 本の累計のアクセス数を計算する。
const calcTotalPageView = (book) => {
  let totalPageView = 0;
  Object.values(book.monthlyRankingHistories).forEach(element => {
    totalPageView += element.pageview;
  });
  return totalPageView;
}

Math.roundCuntom = (targetNumber, decimalPlaces) => {
  let leftShiftNum = 1;
  for (let i = 0; i < decimalPlaces; i++) {
    leftShiftNum *= 10;
  }

  // Math.round(num)は小数点以下一桁目を四捨五入する関数なので、  
  // これを利用するために、いったん小数点を左にずらしてから関数に渡す。
  // 読んだ後ずらした小数点を元に戻す。 
  let num2 = Math.round(targetNumber * leftShiftNum);
  return num2 / leftShiftNum;
}

RankingsChartDrawer.prototype.draw = function (ranking) {
  const dataTable = this.chart.getDataTable();
  const currentNumberOfRows = dataTable.getNumberOfRows();
  dataTable.removeRows(0, currentNumberOfRows);
  ranking.forEach(element => {
    dataTable.addRow([{ v: element.title, f: `${element.rank}.${element.title}` }, element.pageview, element.pageview]);
    dataTable.setRowProperty(dataTable.getNumberOfRows() - 1, 'bookId', element.bookId);
  });

  const formatter = new google.visualization.ArrowFormat();
  formatter.format(dataTable, 1);

  this.chart.getOption('hAxis').maxValue = ranking[0].pageview + 2000;

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
        viewWindow: {
          min: 1
        },
        //ticks: [1,10,20]
      }
    },
    hAxis: {
      format: 'y/MM',
    },
    explorer: {
      // 二軸で表示していると、拡大縮小は水平方向にしか聞かなくなるっぽい
      axis: 'horizontal'
    },
    tooltip: {
      isHtml: true,
      //trigger: 'selection'
    }
  };
  this.chart.setOptions(options);

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn('datetime', '対象月');
  dataTable.addColumn('number', 'アクセス数');
  dataTable.addColumn({ 'type': 'string', 'role': 'tooltip', 'p': { 'html': true } });
  dataTable.addColumn('number', '順位');
  dataTable.addColumn({ 'type': 'string', 'role': 'tooltip', 'p': { 'html': true } });
  this.chart.setDataTable(dataTable);
};

BookDetailChartDrawer.prototype.draw = function (book) {
  const dataTable = this.chart.getDataTable();
  const currentNumberOfRows = dataTable.getNumberOfRows();
  dataTable.removeRows(0, currentNumberOfRows);

  Object.entries(book.monthlyRankingHistories).forEach(keyValue => {
    const targetMonth = keyValue[0];
    const targetMonthDate = new Date(targetMonth);

    const targetRankInfo = keyValue[1];
    const targetMonthFormatted = `${targetMonthDate.getFullYear()}/${targetMonthDate.getMonth() + 1}`;
    const pageViewToolTipHtml = `<div class="text"><div>${targetMonthFormatted}</div><div>アクセス数: <strong>${targetRankInfo.pageview}</strong></div></div>`;
    const rankToolTipHtml = `<div class="text"><div>${targetMonthFormatted}</div><div>順位: <strong>${targetRankInfo.rank}</strong></div></div>`
    dataTable.addRow([
      targetMonthDate,
      targetRankInfo.pageview,
      pageViewToolTipHtml,
      targetRankInfo.rank,
      rankToolTipHtml
    ]);
  });

  // 順位のy軸の表示領域の最大値を、最下位 + 50 か 500 に固定する
  const ranks = Object.values(book.monthlyRankingHistories).map(e => e.rank);
  const worstRank = Math.max(...ranks);
  const viewWindowMax = Math.min((worstRank + 50), 500);
  this.chart.getOptions().vAxes[1].viewWindow.max = Math.max(viewWindowMax);

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

  async function initialize() {
    const monthlyRanking = await fetchSelectedMonthlyRanking();
    rankingsChartDrawer = new RankingsChartDrawer();
    rankingsChartDrawer.draw(monthlyRanking);

    bookDetailChartDrawer = new BookDetailChartDrawer();
  };

  $('#year,#month').change(async () => {
    const selectedMonthlyRanking = await fetchSelectedMonthlyRanking();
    rankingsChartDrawer.draw(selectedMonthlyRanking);
  });

  $('#overlay').click(function (e) {
    const target = e.target;
    if (target.id === 'overlay') {
      $(this).fadeOut();
    }
  });
});

// 画面で選択されている月のランキングデータを取得する。
// プロミスオブジェクトを返す非同期関数
const fetchSelectedMonthlyRanking = () => {
  const yearStr = $('#year').val();
  const monthStr = $('#month').val();

  return fetchMonthlyRanking(yearStr, monthStr);
}

// year: '2018'等　month '01' '02' '12'等
// Promiseを返す非同期関数です。
const fetchMonthlyRanking = (year, month) => {
  const targetUrl = `resources/monthlyRankings/${year}/${month}.json`;
  return getJson(targetUrl);
}

const fetchBookById = (id) => {
  const targetUrl = `resources/books/${id}.json`;
  return getJson(targetUrl);
}

const fetchAuthorById = (id) => {
  const targetUrl = `resources/authors/${id}.json`;
  return getJson(targetUrl);
}

// 指定されたurlのjsonデータを取得し、javascript Objectに変換して返す。
// 実際に返すのはPromiseオブジェクト
// fetchのラッパー。ステータスコードが200~299以外の時はrejectする
const getJson = (url) => {
  const promise = window.fetch(url).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return Promise.reject(new Error(`status code: ${response.status}`));
    }
  });
  return promise;
}