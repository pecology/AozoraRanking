const scraper = require('./aozoraRankingScraper.js');
const fs = require('fs');
const config = require('../config/config.json');

(async () => {
    const startYear = parseInt(config.startMonth.split('/')[0]);
    const startMonth = parseInt(config.startMonth.split('/')[1]);
    const endYear = parseInt(config.endMonth.split('/')[0]);
    const endMonth = parseInt(config.endMonth.split('/')[1]);

    const monthlyRankings = {};
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month < 13; month++) {
            try {
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

    const indent = '    ';

    const monthlyRankingsForOutput = convertToMonthlyRankingsForOutput(monthlyRankings);
    Object.entries(monthlyRankingsForOutput).forEach(keyValue => {
        const targetMonth = keyValue[0];
        const filePath = `./resources/monthlyRankings/${targetMonth}.json`;
        const monthlyRanking = keyValue[1];
        const monthlyRankingJson = JSON.stringify(monthlyRanking, null, indent);
        createFile(filePath, monthlyRankingJson);
    });

    const books = buildBooks(monthlyRankings);
    Object.entries(books).forEach(keyValue => {
        const bookId = keyValue[0];
        const book = keyValue[1];
        const bookJson = JSON.stringify(book, null, indent);
        const filePath = `./resources/books/${bookId}.json`;
        createFile(filePath, bookJson);
    });

    const authors = buildAuthors(monthlyRankings, books);
    Object.entries(authors).forEach(keyValue => {
        const authorId = keyValue[0];
        const author = keyValue[1];
        const authorJson = JSON.stringify(author, null, indent);
        const filePath = `./resources/authors/${authorId}.json`;
        createFile(filePath, authorJson);
    });
})();

// ファイルを作成する。パスのディレクトリが存在しない場合は作成してから作る。
const createFile = (filePath, data) => {
    const path = require('path');
    const dirPath = path.dirname(filePath);
    createDirectoryRecursively(dirPath);

    require('fs').writeFileSync(filePath, data);
}

/**
 * 受け取ったパスのディレクトリを再帰的に作成する
 * 例：/a/b/c → a, b, cフォルダが作成される。
 * @param {string} dirPath 
 */
const createDirectoryRecursively = (dirPath) => {
    const path = require('path');
    const fs = require('fs');

    if (!fs.existsSync(dirPath)) {
        const parentDirPath = path.dirname(dirPath);
        createDirectoryRecursively(parentDirPath);
        fs.mkdirSync(dirPath);
    }
}

const convertToMonthlyRankingsForOutput = (monthlyRankings) => {
    const returnValue = {};
    Object.entries(monthlyRankings).forEach((keyValue) => {
        const key = keyValue[0];

        const value = keyValue[1];
        const array = []
        value.forEach(element => {
            const newElement = {};
            newElement.rank = element.rank;
            newElement.pageview = element.pageview;
            newElement.title = element.title;
            newElement.bookId = element.bookId;
            newElement.authorIds = element.authors.map(author => author.id);

            array.push(newElement);
        });

        returnValue[key] = array;
    });

    return returnValue;
}

const buildBooks = (monthlyRankings) => {
    const books = {};
    for (let monthlyRanking of Object.values(monthlyRankings).reverse()) {
        for (let rankData of monthlyRanking) {
            if (books[rankData.bookId] !== undefined) {
                // 既に作成されている
                continue;
            } else {
                // 作成されていないので、作成
                const book = {};
                book.id = rankData.bookId;
                book.title = rankData.title;
                book.subtitle = rankData.subtitle;
                book.url = rankData.url;
                book.authorIds = rankData.authors.map(author => author.id);
                book.monthlyRankingHistories = buildMonthlyRankingHistories(book.id, monthlyRankings);

                books[rankData.bookId] = book;
            }
        }
    }
    return books;
};

const buildMonthlyRankingHistories = (bookId, monthlyRankings) => {
    const histories = {};
    for (let keyValue of Object.entries(monthlyRankings)) {
        const month = keyValue[0];
        const ranking = keyValue[1];

        const history = {};
        const targetRankData = ranking.find(rankData => rankData.bookId === bookId);
        if (targetRankData !== undefined) {
            history.rank = targetRankData.rank;
            history.pageview = targetRankData.pageview;
        } else {
            // ランクインしていないので、nullを入れる
            history.rank = null;
            history.pageview = null;
        }
        histories[month] = history;
    }
    return histories;
};

const buildAuthors = (monthlyRankings, books) => {
    const authors = {};
    for (let bookIdStr of Object.keys(books)) {
        const bookId = parseInt(bookIdStr);
        const authorIds = findAuthorIdsByBookId(monthlyRankings, bookId);
        if (authorIds === undefined) {
            // 著者がいないのでとばす
            console.log(books[bookId].title);
            continue;
        }

        authorIds.forEach(authorId => {
            if (authors[authorId] === undefined) {
                // 初めてなので、Author作成
                authors[authorId] = createAuthor(monthlyRankings, authorId);
            }

            const author = authors[authorId];
            if (!author.bookIds.includes(bookId)) {
                authors[authorId].bookIds.push(bookId);
            }
        });
    };
    return authors;
};

const findAuthorIdsByBookId = (monthlyRankings, bookId) => {
    for (let ranking of Object.values(monthlyRankings)) {
        const targetRankData = ranking.find(rankData => rankData.bookId === bookId);
        if (targetRankData === undefined) {
            continue;
        } else {
            const authorIds = targetRankData.authors.map(author => author.id);
            return authorIds;
        }
    }
};

const createAuthor = (monthlyRankings, authorId) => {
    for (let ranking of Object.values(monthlyRankings)) {
        for (let rankData of ranking) {
            const author = rankData.authors.find(author => author.id === authorId);
            if (author !== undefined) {
                return {
                    name: author.name,
                    url: author.url,
                    id: author.id,
                    bookIds: []
                };
            }
        }
    }
}