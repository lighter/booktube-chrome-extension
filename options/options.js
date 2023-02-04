function saveData() {
  let youtubeKey = document.getElementById('youtube-key').value;
  chrome.storage.sync.set({
    youtubeKey: youtubeKey,
  }, () => {
    let status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restoreData() {
  chrome.storage.sync.get({
    youtubeKey: '',
  }, (items) => {
    document.getElementById('youtube-key').value = items.youtubeKey;
  });
}

document.getElementById('save').addEventListener('click', saveData);
document.addEventListener('DOMContentLoaded', restoreData);

