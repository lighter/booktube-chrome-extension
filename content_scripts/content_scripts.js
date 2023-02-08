chrome.runtime.sendMessage({message: 'getYoutubeKey'}, function(response) {
  const cs = new ContentScripts(response.getYoutubeKey);
  cs.run();
});

class ContentScripts {
  constructor(key) {
    this.booksUrl = 'www.books.com.tw';
    this.koboUrl = 'www.kobo.com';
    this.href = document.location.href;
    this.key = key;
    this.bookType = ''
  }

  run() {
    if (this.key) {
      if (this.href.includes(this.booksUrl)) {
        this.bookType = 'books';
      }

      if (this.href.includes(this.koboUrl)) {
        this.bookType = 'kobo';
      }

      if (this.bookType !== '') {
        const {isbn: isbn, bookTitle: bookTitle} = new BookInfo(this.bookType);

        const youtube = new SearchYoutube(this.key);
        youtube.ytSearchResult(bookTitle).then((data) => {
          new CreateYoutubeTable(data, this.bookType);
        });
      }
    } else {
      console.log('Please check your Youtube API Key');
    }
  }
}

class BookInfo {
  constructor(bookType) {
    this.isbn_regex = /\b(?:97[89])?\d{9}(\d|X)\b/g;


    switch (bookType) {
      case 'books':
        return this.getBooks();
      case 'kobo':
        return this.getKobo();
    }
  }

  getKobo() {
    let isbn = '';
    let bookTitle = '';

    try {
      let bookInfo = document.getElementById('ratings-widget-details-wrapper').
          getAttribute('data-kobo-gizmo-config');
      bookInfo = bookInfo.replace(/(\r\n|\n|\r)/gm, '');

      bookInfo = JSON.parse(bookInfo);
      let googleBook = JSON.parse(
          bookInfo.googleBook.replace(/(\r\n|\n|\r)/gm, ''));

      isbn = googleBook?.workExample?.isbn;
      bookTitle = googleBook?.name;
      bookTitle = bookTitle.split(/[\s（：【]+/)[0];
    } catch (e) {
      console.log(e);
    }

    return {
      isbn, bookTitle,
    };
  }

  getBooks() {
    let isbn = '';
    let bookTitle = '';

    try {
      bookTitle = document.head.
          querySelector('[property=\'og:title\'][content]').
          content.split(/[\s（：【]+/)[0];

      let description = document.head.querySelector(
          '[property=\'og:description\'][content]').content;
      let matchISBN = description.match(this.isbn_regex);
      if (matchISBN !== null) {
        isbn = matchISBN[0];
      }
    } catch (e) {
      console.log(e);
    }

    return {
      isbn, bookTitle,
    };
  }
}

class SearchYoutube {
  constructor(youtubeKey) {
    this.production = true;
    this.youtubeKey = youtubeKey;
    this.nextPageToken = '';
    this.prevPageToken = '';
  }

  ytSearchResult(title) {
    return new Promise((resolve) => {
      let items = null;

      if (this.production) {
        // 建立 XMLHttpRequest 物件
        let xhr = new XMLHttpRequest();
        const LANG = 'zh-Hant';
        const TYPE = 'video';
        const REGION_CODE = 'TW';
        const Q = title;

        // 設定要連接的 API 網址
        let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' +
            Q +
            '&key=' + this.youtubeKey + '&relevanceLanguage=' + LANG +
            '&type=' +
            TYPE +
            '&regionCode=' + REGION_CODE;

        // 設定 request 的方法和網址
        xhr.open('GET', url, true);

        // 設定 request 的回應函數
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
            // 取得 API 的回應，並轉換成 JSON 格式
            let response = JSON.parse(xhr.responseText);

            // 取得影片數量
            let videoCount = response.pageInfo.totalResults;

            if (videoCount > 0) {
              items = response.items;
            }

            resolve(items);
          }
        };

        // 送出 request
        xhr.send();
      } else {
        let response = testData;

        let videoCount = response.pageInfo.totalResults;

        if (videoCount > 0) {
          items = response.items;
        }

        resolve(items)
      }
    });
  }
}

class CreateYoutubeTable {
  constructor(items, bookType) {
    this.items = items;
    this.bookType = bookType

    this.createFloatingWindow(this.items)
  }

  createFloatingWindow(data) {
    const {top: top, tableWidth: tableWidth} = this.getTableBounding();
    const div = document.createElement('div');
    div.className = 'youtube-search-result';
    div.style.position = 'fixed';
    div.style.top = `${top}px`;
    div.style.zIndex = '99999';
    div.style.left = '5px';
    div.innerHTML = this.createTable(data, `${tableWidth}px`);
    document.body.appendChild(div);
  }

  getTableBounding() {
    let top = 250;
    let tableWidth = 300;
    let className = '';

    switch (this.bookType) {
      case 'books':
        className = 'main_column';
        break;
      case 'kobo':
        className = 'kobo-gizmo item-detail item-detail-actions';
        break;
    }

    const mainColumn = document.getElementsByClassName(className)

    if (Object.keys(mainColumn).length !== 0) {
      const bound = mainColumn[0].getBoundingClientRect();
      top = bound.top;
      tableWidth = bound.left - 10;
    }

    return {
      top, tableWidth
    };
  }

  createTable(data, width) {
    const table = `
    <table style="width: ${width}; border: 1px solid black;">
      <tbody>
      ${data.map(row => `
        <tr>
            <td style="border: 1px solid black; padding: 5px;"><img src="${row.snippet.thumbnails.default.url}"></td>
            <td style="border: 1px solid black; padding: 5px;"><a href="https://www.youtube.com/watch?v=${row.id.videoId}">${row.snippet.title}</a></td>
        </tr>
    `).join('')}
      </tbody>
    </table>
`;
    return table;
  }
}
