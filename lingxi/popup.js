document.addEventListener('DOMContentLoaded', async () => {
  // 加载保存的设置
  const settings = await chrome.storage.sync.get([
    'selectedModel',
    'openaiApiKey',
    'openaiApiUrl',
    'geminiApiKey',
    'geminiApiUrl',
    'claudeApiKey',
    'claudeApiUrl',
    'huggingfaceApiKey',
    'huggingfaceApiUrl',
    'defaultPrompt',
    'promptTemplates'
  ]);

  // 设置默认 API URLs
  const defaultUrls = {
    openai: 'https://api.openai.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    claude: 'https://api.anthropic.com/v1/messages',
    huggingface: 'https://api-inference.huggingface.co/models/facebook/opt-350m'
  };

  // 设置 API URLs
  Object.keys(defaultUrls).forEach(model => {
    const urlInput = document.getElementById(`${model}ApiUrl`);
    if (urlInput) {
      urlInput.value = settings[`${model}ApiUrl`] || defaultUrls[model];
    }
  });

  // 设置默认值
  const modelSelect = document.getElementById('modelSelect');
  modelSelect.value = settings.selectedModel || 'openai';
  showSelectedModelSection(modelSelect.value);

  // 设置 API keys
  if (settings.openaiApiKey) document.getElementById('openaiApiKey').value = settings.openaiApiKey;
  if (settings.geminiApiKey) document.getElementById('geminiApiKey').value = settings.geminiApiKey;
  if (settings.claudeApiKey) document.getElementById('claudeApiKey').value = settings.claudeApiKey;
  if (settings.huggingfaceApiKey) document.getElementById('huggingfaceApiKey').value = settings.huggingfaceApiKey;
  
  // 加载提示词模板
  const promptTemplates = settings.promptTemplates || {};
  updatePromptSelect(promptTemplates);
  updatePromptList(promptTemplates);

  // 设置默认提示词
  document.getElementById('defaultPrompt').value = settings.defaultPrompt || '';

  // 处理模型选择
  modelSelect.addEventListener('change', (e) => {
    showSelectedModelSection(e.target.value);
    chrome.storage.sync.set({ selectedModel: e.target.value });
  });

  // 处理提示词模板选择
  document.getElementById('promptSelect').addEventListener('change', (e) => {
    const selectedTemplate = promptTemplates[e.target.value];
    if (selectedTemplate) {
      document.getElementById('defaultPrompt').value = selectedTemplate;
      chrome.storage.sync.set({ defaultPrompt: selectedTemplate });
    }
  });

  // 处理所有保存 API key 的按钮
  document.querySelectorAll('.save-key').forEach(button => {
    button.addEventListener('click', async () => {
      const section = button.closest('.api-key-section');
      const keyInput = section.querySelector('input[type="password"]');
      const urlInput = section.querySelector('input[type="text"]');
      const status = section.querySelector('.status');
      const modelId = section.id.replace('Key', '');
      
      const apiKey = keyInput.value.trim();
      const apiUrl = urlInput.value.trim();

      if (!apiKey) {
        showStatus(status, 'Please enter an API key', 'error');
        return;
      }

      if (!apiUrl) {
        showStatus(status, 'Please enter an API URL', 'error');
        return;
      }

      try {
        await chrome.storage.sync.set({
          [`${modelId}ApiKey`]: apiKey,
          [`${modelId}ApiUrl`]: apiUrl
        });
        showStatus(status, 'Settings saved successfully!', 'success');
      } catch (error) {
        showStatus(status, 'Error saving settings: ' + error.message, 'error');
      }
    });
  });

  // 保存默认提示词
  document.getElementById('savePrompt').addEventListener('click', async () => {
    const defaultPrompt = document.getElementById('defaultPrompt').value.trim();
    const promptStatus = document.getElementById('promptStatus');
    
    if (!defaultPrompt) {
      showStatus(promptStatus, 'Please enter a prompt template', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ defaultPrompt });
      showStatus(promptStatus, 'Prompt template saved successfully!', 'success');
    } catch (error) {
      showStatus(promptStatus, 'Error saving prompt: ' + error.message, 'error');
    }
  });

  // 添加新的提示词模板
  document.getElementById('addPrompt').addEventListener('click', async () => {
    const nameInput = document.getElementById('newPromptName');
    const textInput = document.getElementById('newPromptText');
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) {
      alert('Please enter both template name and text');
      return;
    }

    try {
      const templates = {...promptTemplates};
      templates[name] = text;
      await chrome.storage.sync.set({ promptTemplates: templates });
      
      // 更新界面
      updatePromptSelect(templates);
      updatePromptList(templates);
      
      // 清空输入框
      nameInput.value = '';
      textInput.value = '';
    } catch (error) {
      alert('Error saving template: ' + error.message);
    }
  });
});

// 更新提示词选择下拉菜单
function updatePromptSelect(templates) {
  const select = document.getElementById('promptSelect');
  select.innerHTML = '<option value="">Select a template...</option>';
  
  Object.entries(templates).forEach(([name, text]) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// 更新提示词列表
function updatePromptList(templates) {
  const list = document.getElementById('promptList');
  list.innerHTML = '';
  
  Object.entries(templates).forEach(([name, text]) => {
    const item = document.createElement('div');
    item.className = 'prompt-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = async () => {
      try {
        const { promptTemplates } = await chrome.storage.sync.get('promptTemplates');
        const updatedTemplates = {...promptTemplates};
        delete updatedTemplates[name];
        await chrome.storage.sync.set({ promptTemplates: updatedTemplates });
        
        // 更新界面
        updatePromptSelect(updatedTemplates);
        updatePromptList(updatedTemplates);
      } catch (error) {
        alert('Error deleting template: ' + error.message);
      }
    };
    
    item.appendChild(nameSpan);
    item.appendChild(deleteButton);
    list.appendChild(item);
  });
}

// 显示选中的模型部分
function showSelectedModelSection(modelId) {
  document.querySelectorAll('.api-key-section').forEach(section => {
    section.classList.add('hidden');
  });
  document.getElementById(`${modelId}Key`).classList.remove('hidden');
}

// 显示状态信息
function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `status ${type}`;
}

// 渲染提示词列表
function renderPrompts(prompts) {
  const promptsList = document.getElementById('promptsList');
  promptsList.innerHTML = '';
  
  if (prompts.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.color = '#666';
    emptyMessage.style.padding = '16px';
    emptyMessage.textContent = 'No templates yet. Add your first one!';
    promptsList.appendChild(emptyMessage);
    return;
  }
  
  prompts.forEach((prompt, index) => {
    const div = document.createElement('div');
    div.className = 'prompt-item';
    
    const text = document.createElement('span');
    text.className = 'prompt-text';
    text.textContent = prompt;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = async () => {
      const { prompts } = await chrome.storage.sync.get('prompts');
      prompts.splice(index, 1);
      await chrome.storage.sync.set({ prompts });
      renderPrompts(prompts);
      updateContextMenus();
    };
    
    div.appendChild(text);
    div.appendChild(deleteBtn);
    promptsList.appendChild(div);
  });
}

// 在保存新提示词后更新右键菜单
async function updateContextMenus() {
  await chrome.contextMenus.removeAll();
  
  chrome.contextMenus.create({
    id: "askGPTParent",
    title: "Ask ChatGPT",
    contexts: ["selection"]
  });

  const { prompts = [] } = await chrome.storage.sync.get('prompts');
  prompts.forEach((prompt, index) => {
    chrome.contextMenus.create({
      id: `prompt-${index}`,
      parentId: "askGPTParent",
      title: prompt,
      contexts: ["selection"]
    });
  });
}

// 验证 API key 是否有效
async function verifyApiKey(apiKey) {
  updateKeyStatus('checking');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      updateKeyStatus('valid');
    } else {
      const error = await response.json();
      updateKeyStatus('invalid', error.error?.message);
    }
  } catch (error) {
    updateKeyStatus('error', error.message);
  }
}

// 更新 API key 状态显示
function updateKeyStatus(status, message = '') {
  const statusElement = document.getElementById('keyStatus');
  let text = '';
  let className = '';

  switch (status) {
    case 'valid':
      text = '✅ API key is valid';
      className = 'valid';
      break;
    case 'invalid':
      text = `❌ Invalid API key: ${message}`;
      className = 'invalid';
      break;
    case 'checking':
      text = '🔄 Verifying API key...';
      break;
    case 'saved':
      text = '💾 API key saved';
      className = 'valid';
      break;
    case 'empty':
      text = '⚠️ Please enter an API key';
      className = 'invalid';
      break;
    case 'validFormat':
      text = '✓ Valid key format';
      className = 'valid';
      break;
    case 'invalidFormat':
      text = '⚠️ Invalid key format (should start with sk-)';
      className = 'invalid';
      break;
    case 'error':
      text = `❌ Error: ${message}`;
      className = 'invalid';
      break;
  }

  statusElement.textContent = text;
  statusElement.className = `status-indicator ${className}`;
}