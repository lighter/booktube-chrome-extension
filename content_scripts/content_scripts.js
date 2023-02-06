const BOOKS_URL = 'www.books.com.tw';
const KOBO_URL = 'www.kobo.com';
const ISBN_REGEX = /\b(?:97[89])?\d{9}(\d|X)\b/g;
const href = document.location.href;

chrome.runtime.sendMessage({ message: 'getYoutubeKey' }, function(response) {
  let KEY = response.getYoutubeKey;
  main(KEY);
});

function main(youtubeKey) {
  let bookType = '';
  const KEY = youtubeKey

  if (href.includes(BOOKS_URL)) {
    bookType = 'books';
  }

  if (href.includes(KOBO_URL)) {
    bookType = 'kobo';
  }

  let contentScripts = new ContentScripts(bookType, KEY);
  const {isbn: isbn, bookTitle: bookTitle} = contentScripts.getBookInfo();
  contentScripts.searchYoutube(bookTitle);
}

class ContentScripts {
  constructor(bookType, youtubeKey) {
    this.production = true;
    this.bookType = bookType;
    this.youtubeKey = youtubeKey;
  }

  getBookInfo() {
    if (this.bookType === 'books') {
      return this.getBooks();
    }

    if (this.bookType === 'kobo') {
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
      let googleBook = JSON.parse(bookInfo.googleBook.replace(/(\r\n|\n|\r)/gm, ''));

      isbn = googleBook?.workExample?.isbn;
      bookTitle = googleBook?.name;
      bookTitle = bookTitle.split(/[\s（：【]+/)[0];
    } catch (e) {
      this.log(e);
    }

    return {
      isbn, bookTitle
    }
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
      let matchISBN = description.match(ISBN_REGEX);
      if (matchISBN !== null) {
        isbn = matchISBN[0];
      }
    } catch (e) {
      this.log(e);
    }

    return {
      isbn, bookTitle
    }
  }

  searchYoutube(title) {
    let items = null;

    if (this.production) {
      // 建立 XMLHttpRequest 物件
      let xhr = new XMLHttpRequest();
      let LANG = 'zh-Hant';
      let TYPE = 'video';
      let REGION_CODE = 'TW';
      let Q = title;

      // 設定要連接的 API 網址
      let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' +
          Q +
          '&key=' + this.youtubeKey + '&relevanceLanguage=' + LANG + '&type=' + TYPE +
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

          this.createFloatingWindow(items);
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

      this.createFloatingWindow(items);
    }
  }

  createFloatingWindow(data) {
    const div = document.createElement('div');
    div.className = 'youtube-search-result';
    div.style.position = 'fixed';
    div.style.top = '250px';
    div.style.left = '10px';
    div.innerHTML = this.createTable(data);
    document.body.appendChild(div);
  }

  createTable(data) {
    const width = this.tableWidth(this.bookType);

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

  tableWidth(bookType) {
    let width = '350px';
    switch (bookType) {
      case 'books':
        width = '350px';
        break;
      case 'kobo':
        width = '300px';
        break;
    }

    return width;
  }

  log(value, key) {
    if (!this.production) {
      console.log(`${key}: ${value}`);
    }
  }
}
