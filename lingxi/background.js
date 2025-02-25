// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  
  // 创建单个菜单项
  chrome.contextMenus.create({
    id: "askGPT",
    title: "Ask ChatGPT",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Menu creation error:', chrome.runtime.lastError);
    } else {
      console.log('Context menu created successfully');
    }
  });
});

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    console.log('Content script injected successfully');
  } catch (err) {
    console.error('Failed to inject content script:', err);
  }
}

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "askGPT") {
    const selectedText = info.selectionText;
    console.log('1. Selected text:', selectedText);

    // 先尝试注入 content script
    await injectContentScript(tab.id);

    // 获取默认提示词和选中的模型
    const { defaultPrompt = 'Please analyze this text: {text}', selectedModel } = 
      await chrome.storage.sync.get(['defaultPrompt', 'selectedModel']);
    console.log('2. Default prompt template:', defaultPrompt);
    console.log('3. Selected model:', selectedModel || 'openai');
    
    // 替换提示词中的占位符
    const fullPrompt = defaultPrompt.replace('{text}', selectedText);
    console.log('4. Full prompt after replacement:', fullPrompt);

    // 调用 AI
    askAI(fullPrompt, tab.id);
  }
});

// 实现真正的 ChatGPT 调用
async function askAI(text, tabId) {
  try {
    console.log('5. Starting AI request with text:', text);

    // 发送加载状态
    chrome.tabs.sendMessage(tabId, {
      type: 'showResponse',
      status: 'loading',
      response: 'Getting response...'
    }).catch(err => console.log('Loading message error (expected):', err));

    // 获取选中的模型和对应的 API key
    const settings = await chrome.storage.sync.get([
      'selectedModel',
      'openaiApiKey',
      'geminiApiKey',
      'claudeApiKey',
      'huggingfaceApiKey'
    ]);
    
    const model = settings.selectedModel || 'openai';
    console.log('6. Using model:', model);
    console.log('7. API key exists:', !!settings[`${model}ApiKey`]);

    let response;
    switch (model) {
      case 'openai':
        response = await callOpenAI(text, settings.openaiApiKey);
        break;
      case 'gemini':
        response = await callGemini(text, settings.geminiApiKey);
        break;
      case 'claude':
        response = await callClaude(text, settings.claudeApiKey);
        break;
      case 'huggingface':
        response = await callHuggingFace(text, settings.huggingfaceApiKey);
        break;
      default:
        throw new Error('Unknown model selected');
    }

    console.log('8. Got AI response:', response.substring(0, 100) + '...');

    // 发送成功响应
    chrome.tabs.sendMessage(tabId, {
      type: 'showResponse',
      status: 'success',
      response: response
    }).catch(err => console.log('Success message error (expected):', err));

  } catch (error) {
    console.error('9. Error in askAI:', error);
    // 发送错误响应
    chrome.tabs.sendMessage(tabId, {
      type: 'showResponse',
      status: 'error',
      response: 'Error: ' + error.message
    }).catch(err => console.log('Error message error (expected):', err));
  }
}

// OpenAI API
async function callOpenAI(text, apiKey) {
  if (!apiKey) throw new Error('Please set your OpenAI API key');
  
  const { openaiApiUrl } = await chrome.storage.sync.get('openaiApiUrl');
  const apiUrl = openaiApiUrl || 'https://api.openai.com/v1/chat/completions';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('OpenAI API error:', error);
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  console.log('OpenAI response data:', data);
  return data.choices[0].message.content;
}

// Google Gemini API
async function callGemini(text, apiKey) {
  if (!apiKey) throw new Error('Please set your Google API key');

  const { geminiApiUrl } = await chrome.storage.sync.get('geminiApiUrl');
  const apiUrl = geminiApiUrl || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  const response = await fetch(
    `${apiUrl}?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }]
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Gemini API error:', error);
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();
  console.log('Gemini response data:', data);
  return data.candidates[0].content.parts[0].text;
}

// Anthropic Claude API
async function callClaude(text, apiKey) {
  if (!apiKey) throw new Error('Please set your Claude API key');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      messages: [{ role: 'user', content: text }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API request failed');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Hugging Face API
async function callHuggingFace(text, apiKey) {
  if (!apiKey) throw new Error('Please set your Hugging Face API key');

  const response = await fetch('https://api-inference.huggingface.co/models/facebook/opt-350m', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Hugging Face API request failed');
  }

  const data = await response.json();
  return data[0].generated_text;
}