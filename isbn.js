const BOOKS_URL = 'www.books.com.tw';
const KOBO_URL = 'www.kobo.com';
const ISBN_REGEX = /\b(?:97[89])?\d{9}(\d|X)\b/g;
const href = document.location.href;
let type = '';

if (href.includes(BOOKS_URL)) {
  type = 'books';
}

if (href.includes(KOBO_URL)) {
  type = 'kobo';
}

if (type === 'books') {
  let isbn = '';
  let title = document.head.querySelector('[property=\'og:title\'][content]').
      content.
      split(/\s+/)[0];
  title = title.split('（')[0];

  let description = document.head.querySelector(
      '[property=\'og:description\'][content]').content;
  let macthISBN = description.match(ISBN_REGEX);

  if (macthISBN !== null) {
    isbn = macthISBN[0];
  }

  console.log(title);
  console.log(isbn);

  searchYoutube(title);
  // createFloatingWindow(searchData);
}

function createFloatingWindow(data) {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '250px';
  div.style.left = '10px';
  // div.style.backgroundColor = 'red';
  // div.innerHTML = 'Hello, World!';
  div.innerHTML = createTable(data);
  document.body.appendChild(div);
}

function createTable(data) {
  // data = [
  //   {
  //     "kind": "youtube#searchResult",
  //     "etag": "AT4eHdCMN08Lt8RnfvHoY5UoumM",
  //     "id": {
  //       "kind": "youtube#video",
  //       "videoId": "NPda4nWkXVw"
  //     },
  //     "snippet": {
  //       "publishedAt": "2022-02-08T12:00:14Z",
  //       "channelId": "UCQbyKhmFHIRptrAJMSwS-dw",
  //       "title": "心理諮詢有沒有用？ 羅伯狄保德寫現實童話 《蛤蟆先生看心理師》Robert de Board｜NeKo嗚喵．說書",
  //       "description": "真心覺得早一點看到這本書~人生一定會有很大的不一樣!! 請用訂閱代替掌聲▷https://goo.gl/4cGq4T 或者在上方按個喜歡❤，我們下 ...",
  //       "thumbnails": {
  //         "default": {
  //           "url": "https://i.ytimg.com/vi/NPda4nWkXVw/default.jpg",
  //           "width": 120,
  //           "height": 90
  //         },
  //         "medium": {
  //           "url": "https://i.ytimg.com/vi/NPda4nWkXVw/mqdefault.jpg",
  //           "width": 320,
  //           "height": 180
  //         },
  //         "high": {
  //           "url": "https://i.ytimg.com/vi/NPda4nWkXVw/hqdefault.jpg",
  //           "width": 480,
  //           "height": 360
  //         }
  //       },
  //       "channelTitle": "NeKo嗚喵",
  //       "liveBroadcastContent": "none",
  //       "publishTime": "2022-02-08T12:00:14Z"
  //     }
  //   }];
    const table = `
    <table style="width: 350px; border: 1px solid black;">
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
  let items = null;

  // 建立 XMLHttpRequest 物件
  let xhr = new XMLHttpRequest();
  let KEY = '';
  let LANG = 'zh-Hant';
  let TYPE = 'video';
  let REGION_CODE = 'TW';
  let Q = title;

  // 設定要連接的 API 網址
  let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + Q +
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
      console.log('video count:' + videoCount);

      if (videoCount > 0) {
        items = response.items;
      }

      createFloatingWindow(items);
    }
  };

  // 送出 request
  xhr.send();
}

