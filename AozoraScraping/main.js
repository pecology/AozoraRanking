const scraper = require('./aozoraRankingScraper.js');
const fs = require('fs');
const zlib = require('zlib');

(async () => {
    const rankings = [];
    for(let year = 2009; year < 2019; year++) {
        for(let month = 1; month < 13; month++) {
            try{
                const monthRankings = await scraper.fetchMonthRankings(year, month);
                rankings.push({
                    month: `${year}/${month}`,
                    rankings: monthRankings
                });
            } catch (e) {
                console.log(e);
            }

            // 1秒間隔をあける(サーバー負荷考慮)
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log(`${year}/${month} 完了`);
        }
    }

    const serializedData = JSON.stringify(rankings);
    await fs.writeFile('rankings.json', serializedData);

    const gzip = zlib.createGzip();
    const inp = fs.createReadStream('rankings.json');
    const out = fs.createWriteStream('rankings.json.gz');
    inp.pipe(gzip).pipe(out);
})();