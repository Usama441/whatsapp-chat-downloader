// WhatsApp Chat Downloader Content Script

function injectDownloadButton() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const chatHeader = document.querySelector('#main header');
        if (chatHeader && !document.querySelector('.whatsapp-downloader-btn')) {
          const downloadBtn = document.createElement('button');
          downloadBtn.innerText = '📥 Download Chat';
          downloadBtn.className = 'whatsapp-downloader-btn';
          downloadBtn.style.cssText = `
            background: linear-gradient(135deg, #6a0dad 0%, #000000 100%);
            color: white;
            border: none;
            padding: 8px 12px;
            margin-left: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
          `;
          downloadBtn.onmouseover = () => {
            downloadBtn.style.transform = 'translateY(-1px)';
            downloadBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
          };
          downloadBtn.onmouseout = () => {
            downloadBtn.style.transform = 'none';
            downloadBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          };
          downloadBtn.onclick = downloadChat;
          chatHeader.appendChild(downloadBtn);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function downloadChat() {
  if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
    alert('Extension not loaded. Please enable the extension in Chrome.');
    return;
  }

  const messages = extractMessages();
  if (messages.length === 0) {
    alert('No messages found. Please scroll to load messages.');
    return;
  }

  const chatData = formatChat(messages);

  try {
    chrome.runtime.sendMessage({
      action: 'downloadChat',
      data: chatData
    }, (response) => {
      if (response && response.success) {
        alert('Chat downloaded successfully!');
      } else {
        alert('Download failed: ' + (response ? response.error : 'Unknown error'));
      }
    });
  } catch (e) {
    alert('Extension error. Please refresh the page or reload the extension.');
  }
}

function extractMessages() {
  const messages = [];
  const messageElements = document.querySelectorAll('#main .message-in, #main .message-out');

  messageElements.forEach(msg => {
    const meta = msg.querySelector('.message-meta');
    const content = msg.querySelector('.selectable-text');

    if (content) {
      const timestamp = meta ? meta.textContent.trim() : 'Unknown time';
      const sender = msg.classList.contains('message-out') ? 'You' : 'Contact';
      const text = content.textContent || '';

      messages.push({
        sender: sender,
        timestamp: timestamp,
        text: text
      });
    }
  });

  return messages;
}

function formatChat(messages) {
  return messages.map(msg => `[${msg.timestamp}] ${msg.sender}: ${msg.text}`).join('\n\n');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectDownloadButton);
} else {
  injectDownloadButton();
}
