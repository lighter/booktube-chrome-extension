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
            this.bindPlayClick();
            this.bindMenuClick();
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

  bindPlayClick() {
    const ytPlayer = (e) => {
      let ytId = e.target.dataset.videoId;

      document.getElementsByClassName('yt-image ' + ytId)[0].classList.remove('active');
      document.getElementsByClassName('play-yt ' + ytId)[0].classList.remove('active');
      document.getElementsByClassName('yt-iframe ' + ytId)[0].classList.add('active');
      document.getElementsByClassName('stop-yt ' + ytId)[0].classList.add('active');
    }

    const ytStop = (e) => {
      let ytId = e.target.dataset.videoId;
      const src = document.getElementsByClassName('yt-iframe ' + ytId)[0].src
      document.getElementsByClassName('yt-iframe ' + ytId)[0].src = src;

      document.getElementsByClassName('yt-image ' + ytId)[0].classList.add('active');
      document.getElementsByClassName('play-yt ' + ytId)[0].classList.add('active');
      document.getElementsByClassName('yt-iframe ' + ytId)[0].classList.remove('active');
      document.getElementsByClassName('stop-yt ' + ytId)[0].classList.remove('active');
    }

    const playYT = document.getElementsByClassName('play-yt');
    if (playYT.length > 0) {
      for (let i = 0; i < playYT.length; i++) {
        playYT[i].removeEventListener('click', ytPlayer);
        playYT[i].addEventListener('click', ytPlayer);
      }
    }

    const stopYT = document.getElementsByClassName('stop-yt');
    if (stopYT.length > 0) {
      for (let i = 0; i < stopYT.length; i++) {
        stopYT[i].removeEventListener('click', ytStop);
        stopYT[i].addEventListener('click', ytStop);
      }
    }
  }


  bindMenuClick() {
    const menuClick = (e) => {
      e.target.classList.remove('active');

      if (e.target.classList.contains('close')) {
        let ytTableWidth = parseInt(
            getComputedStyle(document.getElementsByClassName('yt-table')[0])
              .getPropertyValue('width'), 10
        );

        document.getElementsByClassName('menu-text open')[0].classList.add('active');
        document.getElementsByClassName('yt-container')[0].style.left = '-' + (ytTableWidth + 5) + 'px';
      } else {
        document.getElementsByClassName('menu-text close')[0].classList.add('active');
        document.getElementsByClassName('yt-container')[0].style.left = '5px';
      }
    }

    let menu = document.getElementsByClassName('menu-text');
    if (menu.length > 0) {
      for (let i = 0; i < menu.length; i++) {
        menu[i].removeEventListener('click', menuClick);
        menu[i].addEventListener('click', menuClick);
      }
    }
  }

  goToPage(pageToken) {
    this.youtube.ytSearchResult(this.bookTitle, pageToken).then((data) => {
      new CreateYoutubeTable(data, this.bookType, this.bookTitle, this.isbn);
      this.bindPaginationClick();
      this.bindPlayClick();
      this.bindMenuClick();
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
    const div = document.querySelector('.yt-container');
    if (div) {
      div.remove();
    }
  }

  createFloatingWindow(data, bookTitle, isbn, openStatus = true) {
    const {top: top, tableWidth: tableWidth} = this.getTableBounding();
    const yotubeDiv = document.createElement('div');
    const title = `<p class="table-title">${bookTitle}, ${isbn}</p>`;
    yotubeDiv.className = 'youtube-search-result';
    yotubeDiv.innerHTML = title + this.createTable(data, `${tableWidth}px`);

    const container = document.createElement('div');
    container.innerHTML = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,1,0" />'
    container.className = 'yt-container';
    container.style.top = `${top}px`;
    container.style.zIndex = '99999';
    container.style.left = openStatus ? '5px' : `-${tableWidth}px`;
    container.style.gridTemplateColumns = `${tableWidth}px 40px`;
    container.style.height = window.innerHeight - top - 10 + 'px';

    const openBtn = document.createElement('div');
    openBtn.className = 'menu-div menu';
    const openTag = openStatus ? '' : 'active';
    const closeTag = openStatus ? 'active' : '';
    openBtn.innerHTML = `<p class="menu-text close ${closeTag}">關閉</p><p class="menu-text open ${openTag}">開啟</p>`;

    container.appendChild(yotubeDiv);
    container.appendChild(openBtn);

    document.body.appendChild(container);
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
    let pageLink = '';

    if (data?.prevPageToken) {
      pageLink += `<a class='prev-page' 
                     href='javascript:void(0);' 
                     data-page-token='${data.prevPageToken}'>上一頁</a> | `
    }

    if (data?.nextPageToken) {
      pageLink += `<a class='next-page' 
                     href='javascript:void(0);' 
                     data-page-token='${data.nextPageToken}'>下一頁</a>`
    }

    const table = `
    <style>
    .yt-table {
        width: ${width};
    }
    </style>
    <table class='yt-table'>
      <tbody>
      ${data.items.map(row => `
        <tr>
            <td>
                <img class="yt-image ${row.id.videoId} active" src="${row.snippet.thumbnails.default.url}">
                <iframe class="yt-iframe ${row.id.videoId}" width="120" height="90"
                        src="https://www.youtube.com/embed/${row.id.videoId}?enablejsapi=1&autoplay=0&mute=0&controls=1&modestbranding=1&showinfo=0"
                        ></iframe>
            </td>
            <td class="yt-info">
                <p>${row.snippet.channelTitle} | ${row.snippet.publishedAt}</p>
                <p><a href="https://www.youtube.com/watch?v=${row.id.videoId}">${row.snippet.title}</a></p>
            </td>
            <td>
                <p class="play-yt ${row.id.videoId} material-symbols-outlined active" 
                   data-video-id="${row.id.videoId}">
                    play_circle
                </p>
                <p class="stop-yt ${row.id.videoId} material-symbols-outlined" 
                   data-video-id="${row.id.videoId}">
                   cancel
                 </p>
            </td>
        </tr>
    `).join('')}
      </tbody>
      <tfoot>
        <tr style="text-align: right;"> 
            <td colspan="3">
              ${pageLink}
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
