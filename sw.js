importScripts('jszip.min.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadChat') {
    createZip(message).then(base64 => {
      const url = 'data:application/zip;base64,' + base64;
      const filename = message.contactName ? message.contactName + '.zip' : 'WhatsApp_Chat.zip';

      chrome.downloads.download({
        url: url,
        filename: filename
      }).then((downloadId) => {
        sendResponse({ success: true, downloadId: downloadId });
      }).catch((error) => {
        console.error('Download error:', error);
        sendResponse({ error: error.message });
      });
    }).catch(error => {
      sendResponse({ error: error.message });
    });

    return true;
  }
});

async function createZip(message) {
  const zip = new JSZip();

  // Add text file
  zip.file('chat.txt', message.data);

  // Add media folders
  const imagesFolder = zip.folder('images');
  const voiceFolder = zip.folder('voice_notes');

  for (const item of message.media || []) {
    if (item && item.data) {
      // Data is data URL, extract base64
      const base64 = item.data.split(',')[1];
      if (item.type === 'image') {
        imagesFolder.file(item.filename, base64, { base64: true });
      } else if (item.type === 'audio') {
        voiceFolder.file(item.filename, base64, { base64: true });
      }
    }
  }

  return zip.generateAsync({ type: 'base64' });
}
