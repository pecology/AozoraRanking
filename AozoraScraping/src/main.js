const scraper = require('./aozoraRankingScraper.js');
const fs = require('fs');
const config = require('../config/config.json');

(async () => {
    const startYear = parseInt(config.startMonth.split('/')[0]);
    const startMonth = parseInt(config.startMonth.split('/')[1]);
    const endYear = parseInt(config.endMonth.split('/')[0]);
    const endMonth = parseInt(config.endMonth.split('/')[1]);
    
    const monthlyRankings = {};
    for(let year = startYear; year <= endYear; year++) {
        for(let month = 1; month < 13; month++) {
            try{
                const monthlyRanking = await scraper.fetchMonthlyRanking(config.domainUrl, year, month);
                monthlyRankings[`${year}/${('00' + month).slice(-2)}`] = monthlyRanking;
            } catch (e) {
                console.log(e);
            }

            // 間隔をあける(サーバー負荷考慮)
            await new Promise(resolve => setTimeout(resolve, config.delayMilliseconds));

            console.log(`${year}/${month} 完了`);
        }
    }

    const serializedData = JSON.stringify(monthlyRankings);
    await fs.writeFile('./resources/rankings.json', serializedData);
})();