$(function(){
  $.ajax({
    type: 'GET',
    url: 'resources/rankings.json.gz',
    dataType: 'json'  
  }).done((data) => {
    const a =1;
    const b = 3;
    console.log(data);
  });
});
