const BOOKS_URL = 'www.books.com.tw';
const KOBO_URL = 'www.kobo.com';
const PRODUCTION = true;
const ISBN_REGEX = /\b(?:97[89])?\d{9}(\d|X)\b/g;
const href = document.location.href;
let bookType = '';

if (href.includes(BOOKS_URL)) {
  bookType = 'books';
  getBooks();
}

if (href.includes(KOBO_URL)) {
  bookType = 'kobo';
  getKobo();
}

function getBooks() {
  try {
    let isbn = '';
    let title = document.head.querySelector('[property=\'og:title\'][content]').
        content.
        split(/\s+/)[0];
    title = title.split('（')[0];
    title = title.split('：')[0];

    let description = document.head.querySelector(
        '[property=\'og:description\'][content]').content;
    let matchISBN = description.match(ISBN_REGEX);

    if (matchISBN !== null) {
      isbn = matchISBN[0];
    }

    searchYoutube(title);
  } catch (e) {
    console.log(e);
  }
}

function getKobo() {
  try {
    let isbn = '';
    let title = '';

    let bookInfo = document.getElementById('ratings-widget-details-wrapper').
        getAttribute('data-kobo-gizmo-config');
    bookInfo = bookInfo.replace(/(\r\n|\n|\r)/gm, '');

    bookInfo = JSON.parse(bookInfo);
    let googleBook = JSON.parse(
        bookInfo.googleBook.replace(/(\r\n|\n|\r)/gm, ''));
    let isbn = googleBook?.workExample?.isbn;

    let title = googleBook?.name;
    title = title.split(/\s+/)[0];
    title = title.split('（')[0];
    title = title.split('：')[0];

    searchYoutube(title);
  } catch (e) {
    console.log(e);
  }
}

function createFloatingWindow(data) {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '250px';
  div.style.left = '10px';
  div.innerHTML = createTable(data);
  document.body.appendChild(div);
}

function createTable(data) {
  const width = tableWidth(bookType);

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

function searchYoutube(title) {
  if (PRODUCTION) {
    let items = null;

    // 建立 XMLHttpRequest 物件
    let xhr = new XMLHttpRequest();
    let KEY = '';
    let LANG = 'zh-Hant';
    let TYPE = 'video';
    let REGION_CODE = 'TW';
    let Q = title;

    // 設定要連接的 API 網址
    let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' +
        Q +
        '&key=' + KEY + '&relevanceLanguage=' + LANG + '&type=' + TYPE +
        '&regionCode=' + REGION_CODE;

    // 設定 request 的方法和網址
    xhr.open('GET', url, true);

    // 設定 request 的回應函數
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // 取得 API 的回應，並轉換成 JSON 格式
        let response = JSON.parse(xhr.responseText);

        // 取得影片數量
        let videoCount = response.pageInfo.totalResults;

        if (videoCount > 0) {
          items = response.items;
        }

        createFloatingWindow(items);
      }
    };

    // 送出 request
    xhr.send();
  } else {
    let items = null;
    let response = testData;

    let videoCount = response.pageInfo.totalResults;

    if (videoCount > 0) {
      items = response.items;
    }

    createFloatingWindow(items);
  }
}

function tableWidth(bookType) {
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
