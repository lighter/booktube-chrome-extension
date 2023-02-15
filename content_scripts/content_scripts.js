class ContentScripts {
  constructor(key) {
    this.booksUrl = 'www.books.com.tw';
    this.koboUrl = 'www.kobo.com';
    this.href = document.location.href;
    this.key = key;
    this.bookType = ''

    this.bookTitle = '';
    this.isbn = '';
    this.youtube = null;
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
        this.bookTitle = bookTitle;
        this.isbn = isbn;

        if (this.bookTitle !== '' && this.isbn !== '') {
          this.youtube = new SearchYoutube(this.key);
          this.youtube.ytSearchResult(this.bookTitle).then((data) => {
            new CreateYoutubeTable(data, this.bookType, this.bookTitle, this.isbn);
            this.bindPaginationClick();
          });
        }
      }
    } else {
      console.log('Please check your Youtube API Key');
    }
  }

  bindPaginationClick() {
    let clickGoPage = (e) => {
      this.goToPage(e.target.dataset.pageToken);
    };

    const bindClickClasses = ['next-page', 'prev-page'];
    for (let i = 0; i < bindClickClasses.length; i++) {
      let pageToken = document.getElementsByClassName(bindClickClasses[i]);
      if (pageToken.length > 0) {
        pageToken[0].removeEventListener('click', clickGoPage);
        pageToken[0].addEventListener('click', clickGoPage);
      }
    }
  }

  goToPage(pageToken) {
    this.youtube.ytSearchResult(this.bookTitle, pageToken).then((data) => {
      new CreateYoutubeTable(data, this.bookType);
      this.bindPaginationClick();
    })
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
  }

  ytSearchResult(title, pageToken = '') {
    return new Promise((resolve) => {
      let items = null;

      if (this.production) {
        // 建立 XMLHttpRequest 物件
        let xhr = new XMLHttpRequest();
        const LANG = 'zh-Hant';
        const TYPE = 'video';
        const REGION_CODE = 'TW';
        const Q = title;
        const pageTokenStr = pageToken ? '&pageToken=' + pageToken : '';

        // 設定要連接的 API 網址
        let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' +
            Q +
            '&key=' + this.youtubeKey + '&relevanceLanguage=' + LANG +
            '&type=' +
            TYPE +
            '&regionCode=' + REGION_CODE + pageTokenStr;

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
              items = response;
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
          items = response;
        }

        resolve(items)
      }
    });
  }
}

class CreateYoutubeTable {
  constructor(data, bookType, bookTitle, isbn) {
    this.bookType = bookType;

    this.clearYoutubeSearchResult();
    this.createFloatingWindow(data, bookTitle, isbn);
  }

  clearYoutubeSearchResult() {
    const div = document.querySelector('.youtube-search-result');
    if (div) {
      div.remove();
    }
  }

  createFloatingWindow(data, bookTitle, isbn) {
    const {top: top, tableWidth: tableWidth} = this.getTableBounding();
    const div = document.createElement('div');
    const title = `<p style="font-size: 20px; color: black;">${bookTitle}, ${isbn}</p>`;
    div.className = 'youtube-search-result';
    div.style.position = 'fixed';
    div.style.background = 'white';
    div.style.top = `${top}px`;
    div.style.zIndex = '99999';
    div.style.left = '5px';
    div.innerHTML = title + this.createTable(data, `${tableWidth}px`);
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
    let nextPage = '';
    let prevPage = '';

    if (data?.nextPageToken) {
      nextPage = `<a class='next-page' 
                     href='javascript:void(0);' 
                     data-page-token='${data.nextPageToken}'>下一頁</a>`
    }

    if (data?.prevPageToken) {
      prevPage = `<a class='prev-page' 
                     href='javascript:void(0);' 
                     data-page-token='${data.prevPageToken}'>上一頁</a>`
    }

    const table = `
    <table style="width: ${width}; border: 1px solid black;">
      <tbody>
      ${data.items.map(row => `
        <tr>
            <td style="border: 1px solid black; padding: 5px;"><img src="${row.snippet.thumbnails.default.url}"></td>
            <td style="border: 1px solid black; padding: 5px;"><a href="https://www.youtube.com/watch?v=${row.id.videoId}">${row.snippet.title}</a></td>
        </tr>
    `).join('')}
      </tbody>
      <tfoot>
        <tr style="text-align: right;"> 
            <td colspan="2">
              ${prevPage} | ${nextPage}
            </td>  
        </tr>      
      </tfoot>
    </table>
`;
    return table;
  }
}


(() => {
  chrome.runtime.sendMessage({message: 'getYoutubeKey'}, function(response) {
    const cs = new ContentScripts(response.getYoutubeKey);
    cs.run();
  });
})();
