chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message === 'getYoutubeKey') {
        chrome.storage.sync.get(['youtubeKey'], function(result) {
          sendResponse({getYoutubeKey: result.youtubeKey});
        });
        return true;
      }
    });
