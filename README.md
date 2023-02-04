# Chrome extension 瀏覽書籍，顯示 Youtube 上相關的說書影片

## 介紹

瀏覽博客來,kobo時，會去 youtube 上搜尋該書籍的相關影片，可以直接點擊快速參考。
這個 extension 是嘗試使用詢問 ChatGPT 的結果，組合出來的。

## 安裝

下載到您的資料夾後，進入 chrome://extensions/ ，打開開發人員模式，點選載入未封裝項目，選擇資料夾即可。
還需要自行申請 Youtube API key。詳情申請方式請參考 [Youtube API](https://developers.google.com/youtube/v3/getting-started?hl=zh-tw)

## Todo
- [x] youtube 設定 api key 頁面
- [ ] youtube 設定 api key 頁面調整
- [ ] 搜尋結果暫存，節省 api 次數
- [ ] 搜尋結果分頁
- [ ] 搜尋結果畫面優化
- [ ] 程式碼優化

## License

MIT
