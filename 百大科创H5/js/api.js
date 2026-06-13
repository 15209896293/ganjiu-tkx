/* ============================================================
   百大科创 H5 —— API 层：DeepSeek API 调用封装
   可替换 API Key，兼容 OpenAI 格式的 API 端点
   ============================================================ */

var API_CONFIG = {
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: 'sk-c037224e1f1544fcbf1e459e1771a8f4',
  model: 'deepseek-chat',
  maxTokens: 600,
  temperature: 0.8
};

/**
 * 调用 DeepSeek Chat API（兼容 OpenAI 格式）
 * @param {string} systemPrompt - 系统提示词，定义 AI 的角色和语气
 * @param {string} userMessage - 用户输入的消息
 * @param {object} [options] - 可选参数 {maxTokens, temperature, timeout}
 * @returns {Promise<string>} AI 返回的文本内容
 */
function callDeepSeek(systemPrompt, userMessage, options) {
  options = options || {};

  var controller = new AbortController();
  var timeoutMs = options.timeout || 30000;
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  return fetch(API_CONFIG.baseURL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_CONFIG.apiKey
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
          errMsg = 'API Key 无效，请检查配置~';
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

/**
 * 重新提交上一次的请求（用于出错后重试）
 * @param {string} labId - 实验台 ID
 */
function retryLastLab(labId) {
  var input = document.getElementById('lab-input');
  if (input && STATE.lastLabQuery) {
    input.value = STATE.lastLabQuery;
    submitLab(labId);
  }
}

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
