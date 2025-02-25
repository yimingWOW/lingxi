// 在文件开头添加
console.log('Content script loaded');

// 全局变量跟踪对话框
let responseContainer = null;

// 创建响应容器
function createResponseContainer() {
  // 如果已经存在，直接返回
  if (responseContainer) {
    return responseContainer;
  }

  const container = document.createElement('div');
  container.className = 'gpt-response-container';
  container.innerHTML = `
    <div class="gpt-response-header">
      <h3 class="gpt-response-title">LingXi Response</h3>
      <div class="gpt-response-controls">
        <button class="gpt-response-minimize">-</button>
        <button class="gpt-response-close">×</button>
      </div>
    </div>
    <div class="gpt-response-content"></div>
  `;

  // 添加拖动功能
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  container.querySelector('.gpt-response-header').addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === container.querySelector('.gpt-response-header')) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, container);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  // 添加最小化功能
  const minimizeButton = container.querySelector('.gpt-response-minimize');
  const content = container.querySelector('.gpt-response-content');
  minimizeButton.addEventListener('click', () => {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      minimizeButton.textContent = '-';
    } else {
      content.style.display = 'none';
      minimizeButton.textContent = '+';
    }
  });

  // 添加关闭功能
  container.querySelector('.gpt-response-close').addEventListener('click', () => {
    container.remove();
    responseContainer = null;  // 重置全局变量
  });

  document.body.appendChild(container);
  responseContainer = container;
  return container;
}

// 显示加载状态
function showLoading(container) {
  const content = container.querySelector('.gpt-response-content');
  content.innerHTML = '<div class="gpt-response-loading">Getting response<span class="loading-dots">...</span></div>';
}

// 显示错误信息
function showError(container, message) {
  const content = container.querySelector('.gpt-response-content');
  content.innerHTML = `<div class="gpt-response-error">${message}</div>`;
}

// 显示响应内容
function showResponse(container, response) {
  const content = container.querySelector('.gpt-response-content');
  content.innerHTML = response.replace(/\n/g, '<br>');
}

// 注入样式
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .gpt-response-container {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .gpt-response-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
    }

    .gpt-response-title {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .gpt-response-controls {
      display: flex;
      gap: 8px;
    }

    .gpt-response-minimize,
    .gpt-response-close {
      padding: 4px 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      font-size: 14px;
      border-radius: 4px;
    }

    .gpt-response-minimize:hover,
    .gpt-response-close:hover {
      background: #eee;
    }

    .gpt-response-content {
      padding: 16px;
      overflow-y: auto;
      max-height: calc(80vh - 45px);
      line-height: 1.5;
      font-size: 14px;
      color: #000000;
      background-color: #ffffff;
    }

    .gpt-response-loading {
      color: #666;
      font-style: italic;
    }

    .gpt-response-error {
      color: #dc3545;
    }

    .loading-dots {
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0%, 20% { content: '.'; }
      40%, 60% { content: '..'; }
      80%, 100% { content: '...'; }
    }
  `;
  document.head.appendChild(style);
}

// 初始化
injectStyles();

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  
  if (message.type === 'showResponse') {
    // 获取或创建响应容器
    const container = createResponseContainer();
    
    if (message.status === 'loading') {
      showLoading(container);
    } else if (message.status === 'error') {
      showError(container, message.response);
    } else {
      showResponse(container, message.response);
    }
  }
});

// 添加一个测试函数
function testResponseContainer() {
  if (!responseContainer) {
    responseContainer = createResponseContainer();
  }
  responseContainer.style.display = 'block';
  showResponse(responseContainer, 'This is a test message to verify the response container is working.');
}

// 添加测试快捷键 (Ctrl+Shift+T)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    console.log('Test shortcut pressed');
    testResponseContainer();
  }
});

function createOrUpdateResponseBox(response, status = 'success') {
  let responseBox = document.getElementById('ai-response-box');
  
  if (!responseBox) {
    responseBox = document.createElement('div');
    responseBox.id = 'ai-response-box';
    responseBox.style.cssText = `
      position: fixed;
      right: 20px;
      top: 20px;
      width: 300px;
      max-height: 400px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      color: #000000;  /* 文字颜色改为纯黑 */
    `;

    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #000000;  /* 关闭按钮也改为黑色 */
      cursor: pointer;
      font-size: 18px;
      padding: 4px 8px;
      border-radius: 4px;
    `;
    closeButton.innerHTML = '×';
    closeButton.onclick = () => responseBox.remove();
    responseBox.appendChild(closeButton);

    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      margin-top: 10px;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;
    contentDiv.id = 'ai-response-content';
    responseBox.appendChild(contentDiv);

    document.body.appendChild(responseBox);
  }

  // 更新内容和样式
  const contentDiv = responseBox.querySelector('#ai-response-content');
  
  // 根据状态设置不同的样式
  switch (status) {
    case 'loading':
      contentDiv.style.color = '#000000';  // 加载中也用黑色
      break;
    case 'error':
      contentDiv.style.color = '#dc3545';  // 错误保持红色
      break;
    case 'success':
      contentDiv.style.color = '#000000';  // 成功用黑色
      break;
  }

  contentDiv.textContent = response;
}