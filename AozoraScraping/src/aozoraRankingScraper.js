const client = require('cheerio-httpcli');
const $ = require('cheerio');
const fs = require('fs');

const isHttpUrl = (url) => {
    return url.indexOf('http://') === 0 ||
           url.indexOf('https://') === 0 
}

module.exports.fetchMonthRankings = async (domainUrl, year, month) => {
    const yearStr = '' + year;
    const monthStr = ('00' + month).slice(-2);
    const targetUrl = domainUrl + `/access_ranking/${yearStr}_${monthStr}_xhtml.html`

    let cheerio;
    if(isHttpUrl(targetUrl)) {
        const result = await client.fetch(targetUrl);
        cheerio = result.$;
    }  else {
        cheerio = $.load(fs.readFileSync(targetUrl));
    }

    const rankings = convertFetchResultToRankings(cheerio);
    return rankings;
}

/**
 * ランキングページのリクエスト結果をObjectのArrayに変換する
 * @param {Cheerio} contents ランキングページをfetchした結果のCheerioオブジェクト
 * @return ランキングデータが入ったオブジェクトの配列。各要素は、
 *         rank, title, subtitle, url, authors, pageviewをプロパティに持つ
 */
const convertFetchResultToRankings = (contents) => {
    const trList = contents('table.list>tbody>tr');
    // 最初の要素はヘッダーなので除外
    const rankingsTrElements = trList.not((index) => index == 0);

    const rankings = [];
    rankingsTrElements.each((i, rankingTrElement) => {
        const rankData = convertTrElementToSimpleObject($(rankingTrElement));
        rankings.push(rankData);
    });

    return rankings;
}

/**
 * ランキングページの1データのDOMオブジェクトを単純なObjectに変換する
 * @param {any} tr ランキングページのtbodyタグの中にあるtrタグ
 * Cheerioオブジェクトでラップされているもの
 * 例：
 *    <tr valign=top><td class=normal>7</td>
 *    <td class=normal><a href="https://www.aozora.gr.jp/cards/000081/card456.html" target=_blank>
 *    銀河鉄道の夜</a><br></td>
 *    <td class=normal><a href="https://www.aozora.gr.jp/index_pages/person81.html">宮沢 賢治</a>　</td>
 *    <td class=normal>129727</td>
 *    </tr> 
 * @return ランキングデータが入ったオブジェクト
 */
const convertTrElementToSimpleObject = (tr) => {
    const tdElements = tr.children();
    const data = {};

    data.rank = extractRankFromTdElements(tdElements.eq(0));
    data.title = extractTitleFromTdElements(tdElements.eq(1));
    data.subtitle = extractSubtitleFromTdElements(tdElements.eq(1));
    data.url = extractUrlFromTdElements(tdElements.eq(1));
    data.authors = extractAuthorsFromTdElements(tdElements.eq(2));
    data.pageview = extractPageViewFromTdElements(tdElements.eq(3));

    return data;
}

const extractRankFromTdElements = (tdElement) => {
    const rankStr = tdElement.text();
    return parseInt(rankStr);
}

const extractTitleFromTdElements = (tdElement) => {
    const titleElements = tdElement.contents();
    const title = titleElements.text().trim();
    return title;
}

/**
 * ランキングデータからサブタイトルを抽出する。
 * サブタイトルが存在しない場合、nullを返す。
 * @param {*} tdElement
 */
const extractSubtitleFromTdElements = (tdElement) => {
    const titleElements = tdElement.contents();
    const subtitle = titleElements.eq(2).text();
    return subtitle == "" ? null : subtitle;
}

const extractUrlFromTdElements = (tdElement) => {
    const titleElements = tdElement.contents();
    const url = titleElements.eq(0).attr('href');
    return url;
}

/**
 * ランキングデータから著者の情報を抽出し、配列で返す。
 * 著者は複数人いる可能性があるので、Array型で返す。
 * 作者が存在しない場合、長さ0の配列を返す。
 * @param {*} tdElement 
 * @param オブジェクトの配列。要素はname, urlをプロパティに持つ
 */
const extractAuthorsFromTdElements = (tdElement) => {
    authorsArray = [];

    anchorElements = tdElement.children();
    anchorElements.each((index, anchorElement) => {
        const self = $(anchorElement);
        const name = self.text();
        const url = self.attr('href');
        authorsArray.push({ name: name, url: url });
    });

    return authorsArray;
}

const extractPageViewFromTdElements = (tdElement) => {
    const pageViewStr = tdElement.text();
    return parseInt(pageViewStr);
}