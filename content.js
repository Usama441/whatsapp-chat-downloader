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

async function downloadChat() {
  if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
    alert('Extension not loaded. Please enable the extension in Chrome.');
    return;
  }

  const { messages, media } = await extractMessagesAndMedia();
  if (messages.length === 0) {
    alert('No messages found. Please scroll to load messages.');
    return;
  }

  const chatData = formatChat(messages);
  const contactName = getContactName();

  try {
    chrome.runtime.sendMessage({
      action: 'downloadChat',
      data: chatData,
      contactName: contactName,
      media: media
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

async function extractMessagesAndMedia() {
  const messages = [];
  const mediaPromises = [];
  const messageElements = document.querySelectorAll('#main .message-in, #main .message-out');

  messageElements.forEach((msg, index) => {
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

    // Extract media - only actual images, not emojis
    const img = msg.querySelector('img');
    if (img && img.complete && img.naturalWidth > 200 && img.naturalHeight > 200) {
      const dataUrl = imageToDataURL(img);
      if (dataUrl) {
        mediaPromises.push(Promise.resolve({
          type: 'image',
          data: dataUrl,
          filename: `image_${index + 1}.png`
        }));
      }
    }

    const audio = msg.querySelector('audio');
    if (audio && audio.src) {
      mediaPromises.push(fetchAudioData(audio.src, `voice_${index + 1}.ogg`));
    }
  });

  const media = await Promise.all(mediaPromises);
  return { messages, media };
}

async function fetchAudioData(url, filename) {
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (response.ok) {
      const blob = await response.blob();
      const dataUrl = await blobToDataURL(blob);
      return {
        type: 'audio',
        data: dataUrl,
        filename: filename
      };
    }
  } catch (e) {
    console.error('Failed to fetch audio:', url, e);
  }
  return null;
}

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function imageToDataURL(img) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (e) {
    return null;
  }
}

function formatChat(messages) {
  return messages.map(msg => `[${msg.timestamp}] ${msg.sender}: ${msg.text}`).join('\n\n');
}

function getContactName() {
  const nameElement = document.querySelector('[data-testid="conversation-info-header-chat-title"]') ||
                      document.querySelector('#main header span[dir="auto"]') ||
                      document.querySelector('#main header h1') ||
                      document.querySelector('#main header .chat-title');
  const name = nameElement ? nameElement.textContent.trim() : 'WhatsApp_Chat';
  return name.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectDownloadButton);
} else {
  injectDownloadButton();
}
