/* ============================================================
   百大科创 H5 —— API 层：DeepSeek API 调用封装
   API Key 存储在浏览器 localStorage，不硬编码在源码中
   ============================================================ */

var API_CONFIG = {
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  maxTokens: 600,
  temperature: 0.8
};

/** 从 localStorage 读取用户设置的 API Key */
function getApiKey() {
  return localStorage.getItem('ds_api_key') || '';
}

/** 保存 API Key 到 localStorage */
function setApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem('ds_api_key', key.trim());
    return true;
  }
  return false;
}

/** 检查是否已设置 API Key */
function hasApiKey() {
  var key = getApiKey();
  return !!(key && key.length > 10);
}

/**
 * 调用 DeepSeek Chat API（兼容 OpenAI 格式）
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userMessage - 用户输入
 * @param {object} [options] - 可选参数 {maxTokens, temperature, timeout}
 * @returns {Promise<string>} AI 返回的文本内容
 */
function callDeepSeek(systemPrompt, userMessage, options) {
  options = options || {};

  // ★ 检查是否已设置 API Key
  var apiKey = getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('请先设置 API Key 才能使用 AI 实验室~'));
  }

  var controller = new AbortController();
  var timeoutMs = options.timeout || 30000;
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  return fetch(API_CONFIG.baseURL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: options.maxTokens || API_CONFIG.maxTokens,
      temperature: options.temperature !== undefined ? options.temperature : API_CONFIG.temperature,
      stream: false
    }),
    signal: controller.signal
  })
    .then(function (response) {
      clearTimeout(timeoutId);
      if (!response.ok) {
        var errMsg = 'API 请求失败（' + response.status + '）';
        if (response.status === 401) {
          errMsg = 'API Key 无效，请检查后重新设置~';
        } else if (response.status === 429) {
          errMsg = '请求太快啦，AI 需要喘口气，请稍后再试~';
        } else if (response.status >= 500) {
          errMsg = 'AI 服务器暂时繁忙，请稍后再试~';
        }
        return response.json().then(function (body) {
          throw new Error(body.error && body.error.message ? body.error.message : errMsg);
        }).catch(function (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== errMsg) throw parseErr;
          throw new Error(errMsg);
        });
      }
      return response.json();
    })
    .then(function (data) {
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      throw new Error('AI 返回了空内容，请换个方式再试一次~');
    })
    .catch(function (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('AI 思考超时了（' + (timeoutMs / 1000) + '秒），换个简单点的问题试试~');
      }
      throw error;
    });
}

/** 重新提交上一次的请求（用于出错后重试） */
function retryLastLab(labId) {
  var input = document.getElementById('lab-input');
  if (input && STATE.lastLabQuery) {
    input.value = STATE.lastLabQuery;
    submitLab(labId);
  }
}

/** HTML 转义 */
function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
