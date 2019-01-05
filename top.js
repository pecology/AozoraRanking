let monthRankings;

$(function(){
  google.charts.load('current', {'packages':['corechart']});

  google.charts.setOnLoadCallback(initialize);

  function initialize() {
    $.get('resources/rankings.json').done((result) => {
      monthRankings = result;

      const currentMonthRankings = monthRankings[monthRankings.length - 1].rankings;
      const currentMonth = monthRankings[monthRankings.length - 1].month;

      const data =  new google.visualization.DataTable();
      data.addColumn('string', 'rankAndTitle');
      data.addColumn('number', 'pageview');

      const slisedRankings = currentMonthRankings.slice(0, 10);
      slisedRankings.forEach(element => {
        data.addRow([`${element.rank}.${element.title}`, element.pageview]);
      });
      
      const options = {'title':`${currentMonth} access ranking`,
                       'width': 960,
                       'height': 700,
                        hAxis: {
                      //   slantedText: true,
                      //   slantedTextAngle: -90,
                       },
                       vAxis:{
                         title: 'pageview'
                       },
                       legend: {
                         position: 'none'
                       },
                       'chartArea': {'width': '80%', 'height': '70%'},
                      };

      const chart = new google.visualization.ColumnChart(document.getElementById('chart'));
      chart.draw(data, options);
    });
  };

  
});
