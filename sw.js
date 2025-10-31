chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadChat') {
    const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(message.data);

    chrome.downloads.download({
      url: url,
      filename: 'whatsapp_chat.txt'
    }).then((downloadId) => {
      sendResponse({ success: true, downloadId: downloadId });
    }).catch((error) => {
      console.error('Download error:', error);
      sendResponse({ error: error.message });
    });

    return true;
  }
});
