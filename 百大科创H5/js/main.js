/* ============================================================
   百大科创 H5 —— 交互逻辑层（修复版）
   ============================================================ */

console.log('🚀 AI奇妙之旅 H5 启动中...');

// ── 全局状态 ──
var STATE = {
  currentStation: 'home',
  quizIndex: 0,
  quizScore: 0,
  preTestScore: 0,
  preTestIndex: 0,
  postTestScore: 0,
  earnedBadges: [],
  feedingLevel: 0,
  decisionStep: 0,
  biasTrained: { a: false, b: false },
  aiLabUsed: false
};

// ── 数据持久化（localStorage）──
var STORAGE_KEY = 'ai-journey-data';

function saveProgress() {
  try {
    var data = {
      quizIndex: STATE.quizIndex,
      quizScore: STATE.quizScore,
      preTestScore: STATE.preTestScore,
      postTestScore: STATE.postTestScore,
      earnedBadges: STATE.earnedBadges,
      feedingLevel: STATE.feedingLevel,
      aiLabUsed: STATE.aiLabUsed,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('保存进度失败:', e);
  }
}

function loadProgress() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var data = JSON.parse(raw);
    if (data.quizIndex !== undefined) STATE.quizIndex = data.quizIndex;
    if (data.quizScore !== undefined) STATE.quizScore = data.quizScore;
    if (data.preTestScore !== undefined) STATE.preTestScore = data.preTestScore;
    if (data.postTestScore !== undefined) STATE.postTestScore = data.postTestScore;
    if (data.earnedBadges) STATE.earnedBadges = data.earnedBadges;
    if (data.feedingLevel !== undefined) STATE.feedingLevel = data.feedingLevel;
    if (data.aiLabUsed !== undefined) STATE.aiLabUsed = data.aiLabUsed;
    return true;
  } catch (e) {
    console.warn('加载进度失败:', e);
    return false;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // 重置状态
    STATE.quizIndex = 0;
    STATE.quizScore = 0;
    STATE.preTestScore = 0;
    STATE.postTestScore = 0;
    STATE.earnedBadges = [];
    STATE.feedingLevel = 0;
    STATE.aiLabUsed = false;
    // 刷新显示
    updateBadgeWall();
    loadQuizQuestion();
    console.log('🗑️ 进度已清除');
    return true;
  } catch (e) {
    console.warn('清除进度失败:', e);
    return false;
  }
}

// ── 页面导航 ──
function navigateTo(stationId) {
  console.log('导航到:', stationId);
  try {
    // 隐藏所有页面
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }
    // 取消所有导航高亮
    var navs = document.querySelectorAll('.nav-station');
    for (var j = 0; j < navs.length; j++) {
      navs[j].classList.remove('active');
    }
    // 显示目标页面
    var targetPage = document.getElementById('page-' + stationId);
    if (targetPage) {
      targetPage.classList.add('active');
    } else {
      console.warn('页面未找到: page-' + stationId);
    }
    // 高亮导航按钮
    var targetNav = document.querySelector('[data-station="' + stationId + '"]');
    if (targetNav) {
      targetNav.classList.add('active');
    }
    STATE.currentStation = stationId;
    // 初始化各站内容
    if (stationId === 'station1') initStation1();
    if (stationId === 'station2') initStation2();
    if (stationId === 'station3') initStation3();
    if (stationId === 'station4') initStation4();
    if (stationId === 'station5') initStation5();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch(e) {
    console.error('导航错误:', e);
  }
}

// ── 前测弹窗 ──
function showPreTest() {
  console.log('打开前测');
  STATE.preTestScore = 0;
  STATE.preTestIndex = 0;
  showPreTestQuestion();
  var modal = document.getElementById('modal-preTest');
  if (modal) modal.classList.add('show');
}

function showPreTestQuestion() {
  var container = document.getElementById('preTest-content');
  if (!container) return;
  var idx = STATE.preTestIndex;
  if (idx >= PRE_TEST.length) {
    container.innerHTML = '<h3>前测完成！</h3>'
      + '<p style="font-size:18px;margin:20px 0;">你的基线得分：<strong>' + STATE.preTestScore + ' / ' + PRE_TEST.length + '</strong></p>'
      + '<p style="color:#666;">别担心，这只是起点。完成学习后你会看到自己的进步！</p>'
      + '<button class="btn btn-primary" onclick="closePreTest()" style="margin-top:20px;">✨ 开始探索AI世界</button>';
    saveProgress();
    return;
  }
  var q = PRE_TEST[idx];
  var html = '<p style="color:#999;font-size:13px;">前测 ' + (idx + 1) + ' / ' + PRE_TEST.length + '</p>';
  html += '<p style="font-size:18px;font-weight:700;margin:16px 0;">' + q.question + '</p>';
  html += '<div style="display:flex;flex-direction:column;gap:10px;">';
  for (var i = 0; i < q.options.length; i++) {
    var isMultiStr = q.multi ? 'true' : 'false';
    html += '<button class="quiz-option" onclick="answerPreTest(' + i + ', ' + isMultiStr + ')">' + q.options[i] + '</button>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function answerPreTest(index, isMulti) {
  var q = PRE_TEST[STATE.preTestIndex];
  var correct = false;
  if (isMulti) {
    correct = (q.correct.indexOf(index) !== -1);
  } else {
    correct = (index === q.correct);
  }
  if (correct) STATE.preTestScore++;
  STATE.preTestIndex++;
  showPreTestQuestion();
}

function closePreTest() {
  var modal = document.getElementById('modal-preTest');
  if (modal) modal.classList.remove('show');
  navigateTo('station1');
}

// ── 第一站：AI的时间轴 ──
function initStation1() {
  var grid = document.getElementById('timeline-grid');
  if (!grid || grid.children.length > 0) return;
  var html = '';
  for (var i = 0; i < TIMELINE.length; i++) {
    var era = TIMELINE[i];
    html += '<div class="card" onclick="selectTimelineCard(this, \'' + era.id + '\')" data-era="' + era.id + '">';
    html += '<div class="card-year">' + era.image + ' ' + era.year + '</div>';
    html += '<div class="card-title">' + era.title + '</div>';
    html += '<div class="card-desc">' + era.event + '</div>';
    html += '<div style="margin-top:10px;font-size:14px;color:#555;">' + era.story + '</div>';
    html += '<div class="card-easter">' + era.easter + '</div>';
    html += '</div>';
  }
  grid.innerHTML = html;
  var xiaod = document.getElementById('xiaod-station1');
  if (xiaod) xiaod.textContent = XIAOD_DIALOGUES.station1;
}

function selectTimelineCard(card, eraId) {
  var wasSelected = card.classList.contains('selected');
  var cards = document.querySelectorAll('#timeline-grid .card');
  for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');
  if (!wasSelected) card.classList.add('selected');
}

// ── 第二站：AI的大脑 ──
function initStation2() {
  var xiaod = document.getElementById('xiaod-station2');
  if (xiaod) xiaod.textContent = XIAOD_DIALOGUES.station2;
  STATE.feedingLevel = 0;
  STATE.decisionStep = 0;
  STATE.biasTrained = { a: false, b: false };
  updateFeedingDisplay();
  resetDecisionTree();
  resetBiasLab();
  // 初始化Canvas神经网络 + 拖拽（延迟确保DOM就绪）
  setTimeout(function() {
    initNeuralNet();
    initDragAndDrop();
  }, 100);
}

// ══════════════════════════════════════════════════
//  拖拽交互：数据喂养模拟器
// ══════════════════════════════════════════════════

var dragState = {
  active: false,
  level: -1,
  clone: null,
  item: null,
  dropZone: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0
};

function initDragAndDrop() {
  var items = document.querySelectorAll('.data-item');
  dragState.dropZone = document.getElementById('feeding-model');

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    // 移除旧事件（避免重复绑定）
    item.removeEventListener('mousedown', onDragStart);
    item.removeEventListener('touchstart', onDragStart);
    // 绑定新事件
    item.addEventListener('mousedown', onDragStart);
    item.addEventListener('touchstart', onDragStart, { passive: false });
    item.setAttribute('draggable', 'false'); // 禁用原生拖拽
  }

  // 全局移动/释放事件（只绑定一次）
  if (!dragState._bound) {
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
    dragState._bound = true;
  }
}

function getClientPos(e) {
  return {
    x: e.touches ? e.touches[0].clientX : e.clientX,
    y: e.touches ? e.touches[0].clientY : e.clientY
  };
}

function onDragStart(e) {
  e.preventDefault();
  var item = e.currentTarget;
  var pos = getClientPos(e);
  var rect = item.getBoundingClientRect();
  var level = parseInt(item.getAttribute('data-level'));

  dragState.active = true;
  dragState.item = item;
  dragState.level = level;
  dragState.startX = pos.x;
  dragState.startY = pos.y;
  dragState.offsetX = pos.x - rect.left;
  dragState.offsetY = pos.y - rect.top;

  // 创建拖拽克隆体
  var clone = item.cloneNode(true);
  clone.classList.add('drag-clone');
  clone.style.position = 'fixed';
  clone.style.left = (pos.x - dragState.offsetX) + 'px';
  clone.style.top = (pos.y - dragState.offsetY) + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.zIndex = '999';
  clone.style.pointerEvents = 'none';
  clone.style.opacity = '0.9';
  clone.style.transform = 'rotate(2deg) scale(1.05)';
  document.body.appendChild(clone);
  dragState.clone = clone;

  // 原数据项变灰
  item.classList.add('dragging');
}

function onDragMove(e) {
  if (!dragState.active || !dragState.clone) return;
  e.preventDefault();

  var pos = getClientPos(e);
  var clone = dragState.clone;

  // 移动克隆体跟随手指/鼠标
  clone.style.left = (pos.x - dragState.offsetX) + 'px';
  clone.style.top = (pos.y - dragState.offsetY) + 'px';

  // 检测是否在投放区域上方
  if (dragState.dropZone) {
    var dzRect = dragState.dropZone.getBoundingClientRect();
    var cx = pos.x;
    var cy = pos.y;
    var isOver = cx >= dzRect.left && cx <= dzRect.right &&
                 cy >= dzRect.top && cy <= dzRect.bottom;
    if (isOver) {
      dragState.dropZone.classList.add('drag-over');
      clone.style.transform = 'rotate(0deg) scale(0.9)';
    } else {
      dragState.dropZone.classList.remove('drag-over');
      clone.style.transform = 'rotate(2deg) scale(1.05)';
    }
  }
}

function onDragEnd(e) {
  if (!dragState.active) return;

  var pos = getClientPos(e);
  var dx = pos.x - dragState.startX;
  var dy = pos.y - dragState.startY;
  var movedDistance = Math.sqrt(dx * dx + dy * dy);

  // 检查是否投放到目标区域（拖拽）或点击数据项
  if (dragState.dropZone) {
    var dzRect = dragState.dropZone.getBoundingClientRect();
    var cx = pos.x;
    var cy = pos.y;
    var hitDrop = cx >= dzRect.left && cx <= dzRect.right &&
                  cy >= dzRect.top && cy <= dzRect.bottom;

    if (hitDrop && dragState.level >= 0) {
      // 投放成功！触发喂养动画
      feedData(dragState.level);
      // 投放成功粒子效果
      spawnDropParticles(dzRect.left + dzRect.width / 2, dzRect.top + dzRect.height / 2);
    } else if (movedDistance < 10 && dragState.level >= 0) {
      // 点击回退：几乎没有移动 = 纯点击，直接喂数据
      feedData(dragState.level);
    }
  }

  // 清理拖拽状态
  if (dragState.clone) {
    dragState.clone.style.opacity = '0';
    dragState.clone.style.transition = 'opacity 0.2s';
    setTimeout(function () {
      if (dragState.clone && dragState.clone.parentNode) {
        dragState.clone.parentNode.removeChild(dragState.clone);
      }
    }, 200);
  }
  if (dragState.item) {
    dragState.item.classList.remove('dragging');
  }
  if (dragState.dropZone) {
    dragState.dropZone.classList.remove('drag-over');
  }

  dragState.active = false;
  dragState.item = null;
  dragState.clone = null;
  dragState.level = -1;
}

// 投放成功粒子爆炸效果
function spawnDropParticles(cx, cy) {
  var colors = ['#FFD700', '#FF6B6B', '#4A90D9', '#27AE60', '#F2994A'];
  var count = 12;
  for (var i = 0; i < count; i++) {
    var particle = document.createElement('span');
    var angle = (Math.PI * 2 * i) / count;
    var dist = 40 + Math.random() * 60;
    var size = 6 + Math.random() * 10;
    var color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText =
      'position:fixed;' +
      'left:' + cx + 'px;' +
      'top:' + cy + 'px;' +
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'background:' + color + ';' +
      'border-radius:50%;' +
      'pointer-events:none;' +
      'z-index:1000;' +
      'transition:all 0.6s cubic-bezier(0.25,0.46,0.45,0.94);' +
      'opacity:1;';

    document.body.appendChild(particle);

    // 触发动画
    requestAnimationFrame(function () {
      particle.style.transform =
        'translate(' + Math.cos(angle) * dist + 'px,' + Math.sin(angle) * dist + 'px) scale(0)';
      particle.style.opacity = '0';
    });

    // 清理
    setTimeout(function () {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 700);
  }
}

// 保留 feedData 函数（拖拽和点击都可用）
function feedData(level) {
  STATE.feedingLevel = level;
  updateFeedingDisplay();
}

function updateFeedingDisplay() {
  var data = FEEDING_DATA[STATE.feedingLevel];
  var modelEl = document.getElementById('feeding-model');
  if (!modelEl) return;
  modelEl.innerHTML = '<div class="model-icon">' + data.icon + '</div>'
    + '<div class="accuracy">' + data.accuracy + '%</div>'
    + '<div class="accuracy-label">识别准确率</div>'
    + '<div class="model-msg">' + data.msg + '</div>';
  // 高亮已喂养的级别
  var items = document.querySelectorAll('.data-item');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('fed');
    if (i <= STATE.feedingLevel) {
      items[i].classList.add('fed');
    }
  }
  if (STATE.feedingLevel >= 3) {
    var insight = document.getElementById('feeding-insight');
    if (insight) insight.style.display = 'block';
  }
}

// 决策树
function resetDecisionTree() {
  STATE.decisionStep = 0;
  var qEl = document.getElementById('tree-question');
  if (qEl) qEl.textContent = '第1步：天气怎么样？';
  var optsEl = document.getElementById('tree-options');
  if (optsEl) optsEl.innerHTML = '<button class="tree-option" onclick="decideTree(0)">☀️ 晴天（继续判断）</button>'
    + '<button class="tree-option" onclick="decideTree(1)">🌧️ 下雨 → 不适合</button>';
  var resEl = document.getElementById('tree-result');
  if (resEl) resEl.style.display = 'none';
  var vizEl = document.getElementById('tree-viz');
  if (vizEl) vizEl.innerHTML = '<p style="text-align:center;color:#999;">🌳 决策树将在这里动态生长...</p>';
  var insEl = document.getElementById('tree-insight');
  if (insEl) insEl.style.display = 'none';
}

function decideTree(choice) {
  var step = STATE.decisionStep;
  var question, optionsHtml, result;
  if (step === 0) {
    if (choice === 1) {
      result = { type: 'bad', text: '🌧️ 下雨天公园变泥坑，不适合去！在家看书吧~' };
    } else {
      question = '第2步：温度多少？';
      optionsHtml = '<button class="tree-option" onclick="decideTree(0)">🔥 太热（>35°C）→ 不适合</button>'
        + '<button class="tree-option" onclick="decideTree(1)">😊 温暖（15-30°C）→ 继续</button>'
        + '<button class="tree-option" onclick="decideTree(2)">🥶 太冷（<5°C）→ 不适合</button>';
    }
  } else if (step === 1) {
    if (choice === 0 || choice === 2) {
      result = { type: 'bad', text: choice === 0 ? '🔥 太热了！容易中暑，不适合户外活动。' : '🥶 太冷了！公园里没什么好玩的，不适合。' };
    } else {
      question = '第3步：湿度大吗？';
      optionsHtml = '<button class="tree-option" onclick="decideTree(0)">💧 湿度>80%（闷热）→ 不太适合</button>'
        + '<button class="tree-option" onclick="decideTree(1)">🌤️ 湿度<80%（舒适）→ 继续</button>';
    }
  } else if (step === 2) {
    if (choice === 0) {
      result = { type: 'bad', text: '💧 空气太潮湿了，闷热难受，不太适合户外活动。' };
    } else {
      question = '第4步：风力如何？';
      optionsHtml = '<button class="tree-option" onclick="decideTree(0)">💨 大风（>5级）→ 不太适合</button>'
        + '<button class="tree-option" onclick="decideTree(1)">🍃 微风（<5级）→ 完美！</button>';
    }
  } else if (step === 3) {
    if (choice === 0) {
      result = { type: 'bad', text: '💨 风太大了，小心被吹走！今天更适合室内活动。' };
    } else {
      result = { type: 'good', text: '🎉 完美的公园日！晴天、温暖、舒适、微风——带上零食和水，约上朋友出发吧！' };
    }
  }
  if (result) {
    showTreeResult(result);
  } else {
    STATE.decisionStep++;
    var qEl = document.getElementById('tree-question');
    if (qEl) qEl.textContent = question;
    var optsEl = document.getElementById('tree-options');
    if (optsEl) optsEl.innerHTML = optionsHtml;
    updateTreeViz();
  }
}

function showTreeResult(result) {
  var optsEl = document.getElementById('tree-options');
  if (optsEl) optsEl.innerHTML = '';
  var resEl = document.getElementById('tree-result');
  if (resEl) {
    resEl.style.display = 'block';
    var cls = (result.type === 'good') ? 'result-good' : 'result-bad';
    var symbol = (result.type === 'good') ? '✓' : '✗';
    resEl.innerHTML = '<div class="tree-node ' + cls + '"><strong>' + symbol + '</strong> ' + result.text + '</div>'
      + '<button class="btn btn-outline btn-small" onclick="resetDecisionTree()" style="margin-top:16px;">🔄 换一个场景再试试</button>';
  }
  var insEl = document.getElementById('tree-insight');
  if (insEl) insEl.style.display = 'block';
}

function updateTreeViz() {
  var steps = ['天气判断', '温度判断', '湿度判断', '风力判断'];
  var vizEl = document.getElementById('tree-viz');
  if (!vizEl) return;
  var html = '<div style="display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;">';
  for (var i = 0; i <= STATE.decisionStep; i++) {
    html += '<span style="background:#4A90D9;color:#fff;padding:4px 12px;border-radius:12px;font-size:12px;">' + steps[i] + '</span>';
    if (i < STATE.decisionStep) html += '<span>→</span>';
  }
  html += '</div>';
  vizEl.innerHTML = html;
}

// 偏见实验室
function resetBiasLab() {
  STATE.biasTrained = { a: false, b: false };
  var ra = document.getElementById('bias-result-a');
  var rb = document.getElementById('bias-result-b');
  if (ra) ra.classList.remove('show');
  if (rb) rb.classList.remove('show');
  var ins = document.getElementById('bias-insight');
  if (ins) ins.style.display = 'none';
}

function trainBias(set) {
  STATE.biasTrained[set] = true;
  var resultEl = document.getElementById('bias-result-' + set);
  if (!resultEl) return;
  resultEl.classList.add('show');
  if (set === 'a') {
    resultEl.className = 'bias-result show biased';
    resultEl.innerHTML = '⚠️ <strong>数据组A训练结果：</strong><br>"程序员都是男的"——女程序员识别准确率仅 12%。<br>这就是数据偏见！';
  } else {
    resultEl.className = 'bias-result show fair';
    resultEl.innerHTML = '✅ <strong>数据组B训练结果：</strong><br>"程序员可以是男的也可以是女的"——女程序员识别准确率 89%。<br>多样化的数据 = 公平的AI！';
  }
  if (STATE.biasTrained.a && STATE.biasTrained.b) {
    var ins = document.getElementById('bias-insight');
    if (ins) ins.style.display = 'block';
  }
}

// ── 第三站：AI实验室 ──
function initStation3() {
  var xiaod = document.getElementById('xiaod-station3');
  if (xiaod) xiaod.textContent = XIAOD_DIALOGUES.station3;
}

function openLabModule(labId) {
  console.log('🔬 openLabModule 被调用:', labId);
  try {
    var lab = null;
    for (var i = 0; i < AI_LABS.length; i++) {
      if (AI_LABS[i].id === labId) { lab = AI_LABS[i]; break; }
    }
    if (!lab) {
      console.error('未找到实验台:', labId);
      return;
    }
    // 取消所有选中
    var modules = document.querySelectorAll('.lab-module');
    for (var j = 0; j < modules.length; j++) modules[j].style.borderColor = 'transparent';
    var targetModule = document.querySelector('[data-lab="' + labId + '"]');
    if (targetModule) targetModule.style.borderColor = '#2B579A';
    // 渲染活动区域
    var area = document.getElementById('lab-active-area');
    if (!area) {
      console.error('未找到 lab-active-area 元素');
      return;
    }
    var html = '<div class="lab-area"><h3>' + lab.icon + ' ' + lab.title + '</h3>';
    html += '<p class="lab-desc">' + lab.desc + '</p>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">';
    for (var k = 0; k < lab.quickPrompts.length; k++) {
      html += '<button class="btn btn-outline btn-small" onclick="quickPrompt(\'' + lab.quickPrompts[k] + '\')" style="font-size:12px;">' + lab.quickPrompts[k] + '</button>';
    }
    html += '</div>';
    html += '<div class="lab-input-area">';
    html += '<input type="text" id="lab-input" placeholder="' + lab.placeholder + '" onkeydown="if(event.key===\'Enter\')submitLab(\'' + labId + '\')">';
    html += '<button class="btn btn-primary btn-small" onclick="submitLab(\'' + labId + '\')">发送</button>';
    html += '</div><div class="lab-response" id="lab-response"></div></div>';
    area.innerHTML = html;
    // 滚动到可视区域
    area.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log('✅ 实验台已打开:', lab.title);
  } catch (e) {
    console.error('❌ openLabModule 出错:', e.message);
    alert('实验台打开失败：' + e.message + '\n请刷新页面后重试');
  }
}

function quickPrompt(text) {
  var input = document.getElementById('lab-input');
  if (input) input.value = text;
}

function submitLab(labId) {
  var input = document.getElementById('lab-input');
  var response = document.getElementById('lab-response');
  if (!input || !response) return;
  var text = input.value.trim();
  if (!text) return;

  // 获取当前实验台的系统提示词
  var systemPrompt = AI_LAB_PROMPTS[labId] || AI_LAB_PROMPTS.qa;

  // 保存以便出错时重试
  STATE.lastLabQuery = text;

  // 显示 loading 状态
  response.classList.add('show');
  response.innerHTML = '<div class="ai-loading">'
    + '<div class="bot-anim">🤖</div>'
    + '<p style="color:#999;margin-top:8px;">AI正在思考...</p>'
    + '<div class="loading-dots">'
    + '<span class="loading-dot">●</span>'
    + '<span class="loading-dot">●</span>'
    + '<span class="loading-dot">●</span>'
    + '</div></div>';
  input.value = '';

  // 调用真实 DeepSeek API
  callDeepSeek(systemPrompt, text)
    .then(function (reply) {
      response.innerHTML = '<div class="ai-reply">' + escapeHtml(reply) + '</div>';
      STATE.aiLabUsed = true;
      saveProgress();
    })
    .catch(function (error) {
      response.innerHTML = '<div class="ai-error">'
        + '<p>😅 ' + escapeHtml(error.message) + '</p>'
        + '<button class="btn btn-outline btn-small retry-btn" onclick="retryLastLab(\'' + labId + '\')">🔄 再试一次</button>'
        + '</div>';
    });
}

// ── 第四站：AI大挑战 ──
var QUESTIONS = []; // 选5道题

function initStation4() {
  var xiaod = document.getElementById('xiaod-station4');
  if (xiaod) xiaod.textContent = XIAOD_DIALOGUES.station4;
  if (QUESTIONS.length === 0) {
    // 从题库选5道：第1,4,7,10,14题（每个级别各1题）
    QUESTIONS = [QUIZ_BANK[0], QUIZ_BANK[3], QUIZ_BANK[6], QUIZ_BANK[9], QUIZ_BANK[13]];
  }
  STATE.quizIndex = 0;
  STATE.quizScore = 0;
  STATE.earnedBadges = [];
  updateBadgeWall();
  loadQuizQuestion();
}

function loadQuizQuestion() {
  var container = document.getElementById('quiz-container');
  if (!container) return;
  if (STATE.quizIndex >= QUESTIONS.length) {
    showQuizComplete();
    return;
  }
  var q = QUESTIONS[STATE.quizIndex];
  var html = '<div class="quiz-card">';
  html += '<div class="quiz-level">第 ' + (STATE.quizIndex + 1) + ' 关 / ' + QUESTIONS.length + ' 关 | ' + q.type + '</div>';
  html += '<div class="quiz-question">' + q.question + '</div>';
  html += '<div class="quiz-options">';
  for (var i = 0; i < q.options.length; i++) {
    html += '<button class="quiz-option" onclick="answerQuiz(' + i + ')" id="opt-' + i + '">' + q.options[i] + '</button>';
  }
  html += '</div>';
  html += '<div class="quiz-feedback" id="quiz-feedback"></div>';
  html += '<div class="quiz-next" id="quiz-next" style="display:none;">';
  var nextLabel = (STATE.quizIndex < QUESTIONS.length - 1) ? '下一关 →' : '查看结果 ✨';
  html += '<button class="btn btn-primary" onclick="nextQuiz()">' + nextLabel + '</button>';
  html += '</div></div>';
  container.innerHTML = html;
}

function answerQuiz(chosen) {
  var q = QUESTIONS[STATE.quizIndex];
  var isCorrect = (chosen === q.correct);
  // 禁用所有选项
  for (var i = 0; i < q.options.length; i++) {
    var optBtn = document.getElementById('opt-' + i);
    if (optBtn) optBtn.style.pointerEvents = 'none';
  }
  // 高亮正确答案
  var correctBtn = document.getElementById('opt-' + q.correct);
  if (correctBtn) correctBtn.classList.add('correct');
  if (!isCorrect) {
    var wrongBtn = document.getElementById('opt-' + chosen);
    if (wrongBtn) wrongBtn.classList.add('wrong');
  }
  // 反馈
  var fb = document.getElementById('quiz-feedback');
  if (!fb) return;
  fb.classList.add('show');
  if (isCorrect) {
    STATE.quizScore++;
    STATE.earnedBadges.push(BADGES[STATE.quizIndex].id);
    fb.className = 'quiz-feedback correct show';
    fb.innerHTML = '✅ ' + (XIAOD_DIALOGUES.quizCorrect[STATE.quizScore - 1] || '答对了！');
    SoundFx.play('correct');
    // 延迟播徽章音效（等叮咚声结束）
    setTimeout(function () { SoundFx.play('badge'); }, 350);
  } else {
    fb.className = 'quiz-feedback wrong show';
    fb.innerHTML = '❌ 没关系，看看正确答案：<br><br>' + q.explain;
    SoundFx.play('wrong');
  }
  document.getElementById('quiz-next').style.display = 'block';
  updateBadgeWall();
  saveProgress();
}

function nextQuiz() {
  STATE.quizIndex++;
  if (STATE.quizIndex >= QUESTIONS.length) {
    showQuizComplete();
  } else {
    loadQuizQuestion();
  }
}

function showQuizComplete() {
  STATE.postTestScore = POST_TEST.length; // 模拟后测满分
  SoundFx.play('complete');
  saveProgress();
  var growth = Math.round((STATE.postTestScore - STATE.preTestScore) / Math.max(STATE.preTestScore, 1) * 100);
  if (STATE.preTestScore === 0) growth = 100;
  var container = document.getElementById('quiz-container');
  if (!container) return;
  var html = '<div class="quiz-card">';
  html += '<h2 style="font-size:28px;color:#1A3A6B;">🎉 恭喜通关！</h2>';
  html += '<p style="font-size:16px;color:#666;margin:12px 0;">' + XIAOD_DIALOGUES.quizComplete + '</p>';
  html += '<div class="growth-display">';
  html += '<div class="growth-title">📊 你的AI知识成长曲线</div>';
  html += '<div class="growth-bars">';
  html += '<div class="growth-bar-wrap"><div class="growth-bar pre" style="height:' + (STATE.preTestScore / 3 * 140) + 'px;"></div><div class="growth-label">前测</div><div class="growth-score">' + STATE.preTestScore + '/3</div></div>';
  html += '<div class="growth-bar-wrap"><div class="growth-bar post" style="height:' + (STATE.postTestScore / 3 * 140) + 'px;"></div><div class="growth-label">后测</div><div class="growth-score">' + STATE.postTestScore + '/3</div></div>';
  html += '</div>';
  html += '<p style="margin-top:16px;font-size:16px;font-weight:700;color:#27AE60;">⬆️ 知识增长：+' + growth + '%！</p>';
  html += '</div>';
  // 徽章墙
  html += '<div class="badge-wall" style="margin:24px 0;">';
  for (var b = 0; b < BADGES.length; b++) {
    html += '<div class="badge-item earned"><div class="badge-icon">' + BADGES[b].icon + '</div><div class="badge-name">' + BADGES[b].name + '</div><div class="badge-desc">' + BADGES[b].desc + '</div></div>';
  }
  html += '</div>';
  // 专属AI伙伴
  html += '<div style="margin-top:24px;padding:24px;background:linear-gradient(135deg,#F5F9FF,#FFF3E6);border-radius:12px;">';
  html += '<h3 style="margin-bottom:12px;">🤖 你的专属AI伙伴</h3>';
  html += '<p style="font-size:14px;color:#666;">选择你最需要的功能：</p>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:16px 0;" id="partner-opts">';
  var partnerOpts = ['帮我整理笔记','给我出数学题','教我写诗','给我推荐书籍','做我的学习闹钟','陪我聊天'];
  for (var p = 0; p < partnerOpts.length; p++) {
    html += '<label style="padding:8px 14px;background:#fff;border-radius:20px;cursor:pointer;font-size:13px;border:1px solid #E8EFF8;"><input type="checkbox" onchange="updatePartner()"> ' + partnerOpts[p] + '</label>';
  }
  html += '</div><div id="partner-card" style="margin-top:16px;"></div></div>';
  html += '</div>';
  container.innerHTML = html;
}

function updatePartner() {
  var card = document.getElementById('partner-card');
  if (!card) return;
  var checked = [];
  var inputs = document.querySelectorAll('#partner-opts input:checked');
  for (var i = 0; i < inputs.length; i++) {
    checked.push(inputs[i].parentElement.textContent.trim());
  }
  if (checked.length === 0) { card.innerHTML = ''; return; }
  card.innerHTML = '<div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);text-align:center;">'
    + '<div style="font-size:48px;">🤖</div>'
    + '<div style="font-size:18px;font-weight:700;color:#1A3A6B;">你的专属AI伙伴：<strong style="color:#2B579A;">小智</strong></div>'
    + '<div style="font-size:13px;color:#666;margin-top:8px;">它最擅长：' + checked.slice(0,3).join('、') + '</div>'
    + '<div style="font-size:14px;color:#666;margin-top:8px;font-style:italic;">"嗨！我是小智，你的学习好伙伴。让我们一起进步吧！"</div></div>';
}

function updateBadgeWall() {
  var wall = document.getElementById('badge-wall');
  if (!wall) return;
  var html = '';
  for (var i = 0; i < BADGES.length; i++) {
    var earned = (STATE.earnedBadges.indexOf(BADGES[i].id) !== -1);
    html += '<div class="badge-item' + (earned ? ' earned' : '') + '">';
    html += '<div class="badge-icon">' + (earned ? BADGES[i].icon : '🔒') + '</div>';
    html += '<div class="badge-name">' + BADGES[i].name + '</div>';
    html += '<div class="badge-desc">' + BADGES[i].desc + '</div>';
    html += '</div>';
  }
  wall.innerHTML = html;
}

// ── 第五站：资源库 ──
function initStation5() {
  var xiaod = document.getElementById('xiaod-station5');
  if (xiaod) xiaod.textContent = XIAOD_DIALOGUES.station5;
}

// ═══════════════════════════════════════════════════════════
//  Canvas神经网络动画
// ═══════════════════════════════════════════════════════════

var neuralAnimId = null;
var neuralPulses = [];
var neuralCanvas = null;
var neuralCtx = null;

// 网络节点坐标（在drawNeuralNet中计算）
var neuralNodes = { input: [], hidden: [], output: [] };

function initNeuralNet() {
  neuralCanvas = document.getElementById('neural-canvas');
  if (!neuralCanvas) return;
  neuralCtx = neuralCanvas.getContext('2d');
  computeNodePositions();
  drawNeuralNet('cat', false); // 默认显示猫的权重
}

// 计算三层节点的画布坐标
function computeNodePositions() {
  if (!neuralCanvas) return;
  var w = neuralCanvas.width;
  var h = neuralCanvas.height;
  var cx = w / 2;
  var cy = h / 2;

  // 输入层：左侧，3个节点垂直排列
  var inputX = 120;
  neuralNodes.input = [
    { x: inputX, y: cy - 80, label: '尖耳朵？', feature: 'ear' },
    { x: inputX, y: cy,       label: '圆脸？',   feature: 'face' },
    { x: inputX, y: cy + 80,  label: '胡须？',   feature: 'whisker' }
  ];

  // 隐藏层：中间，4个节点
  var hiddenX = cx;
  neuralNodes.hidden = [
    { x: hiddenX, y: cy - 100, label: '' },
    { x: hiddenX, y: cy - 33,  label: '' },
    { x: hiddenX, y: cy + 33,  label: '' },
    { x: hiddenX, y: cy + 100, label: '' }
  ];

  // 输出层：右侧，2个节点
  var outputX = w - 120;
  neuralNodes.output = [
    { x: outputX, y: cy - 40, label: '🐱 猫',    id: 'cat' },
    { x: outputX, y: cy + 40, label: '🐶 狗',    id: 'dog' }
  ];
}

// 绘制完整的神经网络
function drawNeuralNet(targetClass, showResult) {
  if (!neuralCtx) return;
  var ctx = neuralCtx;
  var w = neuralCanvas.width;
  var h = neuralCanvas.height;

  // 清空
  ctx.clearRect(0, 0, w, h);

  // 背景网格
  ctx.strokeStyle = '#F0F4F8';
  ctx.lineWidth = 0.5;
  for (var gx = 0; gx < w; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
  }
  for (var gy = 0; gy < h; gy += 40) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }

  // 连线：输入层 → 隐藏层
  for (var i = 0; i < neuralNodes.input.length; i++) {
    for (var j = 0; j < neuralNodes.hidden.length; j++) {
      var weight = getConnectionWeight(neuralNodes.input[i].feature, j, targetClass);
      drawConnection(ctx, neuralNodes.input[i], neuralNodes.hidden[j], weight);
    }
  }

  // 连线：隐藏层 → 输出层
  for (var j = 0; j < neuralNodes.hidden.length; j++) {
    for (var k = 0; k < neuralNodes.output.length; k++) {
      var weight = getOutputWeight(j, neuralNodes.output[k].id, targetClass);
      drawConnection(ctx, neuralNodes.hidden[j], neuralNodes.output[k], weight);
    }
  }

  // 画脉冲（动画中的光点）
  for (var p = 0; p < neuralPulses.length; p++) {
    drawPulse(ctx, neuralPulses[p]);
  }

  // 画节点
  drawNodeLayer(ctx, neuralNodes.input, '#FF6B6B', '输入层');
  drawNodeLayer(ctx, neuralNodes.hidden, '#4A90D9', '隐藏层');
  drawNodeLayer(ctx, neuralNodes.output, '#B0B0B0', '输出层');

  // 如果有结果，高亮输出节点
  if (showResult) {
    for (var kk = 0; kk < neuralNodes.output.length; kk++) {
      if (neuralNodes.output[kk].id === targetClass) {
        highlightNode(ctx, neuralNodes.output[kk], '#27AE60');
      }
    }
  }

  // 层标签
  ctx.fillStyle = '#999';
  ctx.font = '12px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.fillText('👁️ 输入层', 120, h - 15);
  ctx.fillText('🧠 隐藏层', w/2, h - 15);
  ctx.fillText('💬 输出层', w - 120, h - 15);
}

// 获取连接权重（模拟训练好的权重）
function getConnectionWeight(inputFeature, hiddenIdx, targetClass) {
  // 模拟：猫对"尖耳朵"敏感，狗对"圆脸"敏感
  var baseWeight = 0.2 + Math.random() * 0.1; // 基线随机权重（仅首次）
  // 用确定性逻辑替代随机
  var seed = (inputFeature.length * 7 + hiddenIdx * 13 + targetClass.length * 3) % 10;
  var weight = 0.15 + seed * 0.06;

  if (targetClass === 'cat') {
    if (inputFeature === 'ear') weight = 0.7 + hiddenIdx * 0.05;
    if (inputFeature === 'face') weight = 0.3 + hiddenIdx * 0.05;
    if (inputFeature === 'whisker') weight = 0.5 + hiddenIdx * 0.05;
  } else {
    if (inputFeature === 'ear') weight = 0.3 + hiddenIdx * 0.05;
    if (inputFeature === 'face') weight = 0.6 + hiddenIdx * 0.05;
    if (inputFeature === 'whisker') weight = 0.25 + hiddenIdx * 0.05;
  }
  return Math.min(weight, 0.95);
}

function getOutputWeight(hiddenIdx, outputId, targetClass) {
  var seed = (hiddenIdx * 11 + outputId.length * 7) % 10;
  var weight = 0.2 + seed * 0.05;
  if (outputId === targetClass) weight = 0.6 + hiddenIdx * 0.08;
  return Math.min(weight, 0.95);
}

// 画一条连接线（粗细=权重）
function drawConnection(ctx, from, to, weight) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  var alpha = 0.15 + weight * 0.5;
  ctx.strokeStyle = 'rgba(74,144,217,' + alpha + ')';
  ctx.lineWidth = 1 + weight * 4;
  ctx.stroke();
}

// 画一层节点
function drawNodeLayer(ctx, nodes, color, layerLabel) {
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    // 光晕
    var gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 22);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 实心圆
    ctx.beginPath();
    ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标签
    if (n.label) {
      ctx.fillStyle = '#333';
      ctx.font = '11px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + 30);
    }
  }
}

// 高亮输出节点
function highlightNode(ctx, node, color) {
  // 外圈发光
  var glowGrad = ctx.createRadialGradient(node.x, node.y, 10, node.x, node.y, 30);
  glowGrad.addColorStop(0, color);
  glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // 重画节点
  ctx.beginPath();
  ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 决策文字
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.fillText(node.label, node.x, node.y + 5);
}

// 画脉冲光点
function drawPulse(ctx, pulse) {
  var progress = pulse.progress;
  var fromX = pulse.from.x;
  var fromY = pulse.from.y;
  var toX = pulse.to.x;
  var toY = pulse.to.y;

  // 贝塞尔缓动
  var t = easeInOutCubic(progress);
  var x = fromX + (toX - fromX) * t;
  var y = fromY + (toY - fromY) * t;

  // 光点大小：中间大，两端小
  var size = 3 + Math.sin(progress * Math.PI) * 3;

  // 光晕
  var glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
  glowGrad.addColorStop(0, 'rgba(255,180,50,1)');
  glowGrad.addColorStop(0.4, 'rgba(255,150,30,0.6)');
  glowGrad.addColorStop(1, 'rgba(255,100,0,0)');
  ctx.beginPath();
  ctx.arc(x, y, size * 3, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // 核心光点
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700';
  ctx.fill();
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 触发一次脉冲流动
function triggerNeuralPulse(targetClass) {
  if (!neuralCtx) { initNeuralNet(); }
  if (!neuralCtx) return;

  // 清除之前的脉冲和动画
  cancelAnimationFrame(neuralAnimId);
  neuralPulses = [];

  var statusEl = document.getElementById('neural-status');
  if (statusEl) {
    statusEl.innerHTML = '⚡ 数据正在神经网络中流动... <span style="color:#4A90D9;">正在分析特征 →</span>';
  }

  // 阶段1：输入层→隐藏层（创建12个脉冲，每个输入节点→每个隐藏节点）
  var phase1Pulses = [];
  for (var i = 0; i < neuralNodes.input.length; i++) {
    for (var j = 0; j < neuralNodes.hidden.length; j++) {
      phase1Pulses.push({
        from: neuralNodes.input[i],
        to: neuralNodes.hidden[j],
        progress: 0,
        phase: 1
      });
    }
  }

  // 阶段2：隐藏层→输出层
  var phase2Pulses = [];
  for (var jj = 0; jj < neuralNodes.hidden.length; jj++) {
    for (var k = 0; k < neuralNodes.output.length; k++) {
      phase2Pulses.push({
        from: neuralNodes.hidden[jj],
        to: neuralNodes.output[k],
        progress: 0,
        phase: 2
      });
    }
  }

  var phase = 1;
  var phase1Done = false;
  var phase2Done = false;
  var startTime = Date.now();

  function animate() {
    var elapsed = Date.now() - startTime;

    if (phase === 1) {
      // 阶段1：输入→隐藏，持续800ms
      var p1Progress = Math.min(elapsed / 800, 1);
      for (var p = 0; p < phase1Pulses.length; p++) {
        phase1Pulses[p].progress = p1Progress;
      }
      neuralPulses = phase1Pulses;

      if (p1Progress >= 1) {
        phase = 2;
        startTime = Date.now();
        neuralPulses = [];
        if (statusEl) {
          statusEl.innerHTML = '🔍 特征分析完成！<span style="color:#F2994A;">正在传递到输出层 →</span>';
        }
      }
    }

    if (phase === 2) {
      // 阶段2：隐藏→输出，持续600ms
      var p2Progress = Math.min((Date.now() - startTime) / 600, 1);
      for (var q = 0; q < phase2Pulses.length; q++) {
        phase2Pulses[q].progress = p2Progress;
      }
      neuralPulses = phase2Pulses;

      if (p2Progress >= 1 && !phase2Done) {
        phase2Done = true;
        neuralPulses = [];
        // 显示最终结果
        drawNeuralNet(targetClass, true);
        var resultLabel = targetClass === 'cat' ? '🐱 猫' : '🐶 狗';
        if (statusEl) {
          statusEl.innerHTML = '✅ <strong style="color:#27AE60;">判断完成！AI认为这是：' + resultLabel + '</strong>（置信度 94%）';
        }
        return; // 动画结束
      }
    }

    drawNeuralNet(targetClass, phase === 2 && phase2Done);
    neuralAnimId = requestAnimationFrame(animate);
  }

  animate();
}

// 重置神经网络
function resetNeuralNet() {
  cancelAnimationFrame(neuralAnimId);
  neuralPulses = [];
  drawNeuralNet('cat', false);
  var statusEl = document.getElementById('neural-status');
  if (statusEl) {
    statusEl.innerHTML = '👆 点击上方按钮，观察数据如何在神经网络中流动';
  }
}

// ═══════════════════════════════════════════════════════════

// ── 初始化入口 ──
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM加载完成');

  // 绑定导航按钮
  var navBtns = document.querySelectorAll('.nav-station');
  for (var i = 0; i < navBtns.length; i++) {
    navBtns[i].addEventListener('click', function() {
      var station = this.getAttribute('data-station');
      if (station) navigateTo(station);
      // 移动端点击后关闭菜单
      var navContainer = document.getElementById('nav-stations');
      if (navContainer) navContainer.classList.remove('open');
    });
  }

  // 汉堡菜单切换
  var hamburger = document.getElementById('hamburger-btn');
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      var navContainer = document.getElementById('nav-stations');
      if (navContainer) navContainer.classList.toggle('open');
    });
  }

  // 点击页面其他地方关闭移动端菜单
  document.addEventListener('click', function(e) {
    var navContainer = document.getElementById('nav-stations');
    var hamburgerBtn = document.getElementById('hamburger-btn');
    if (navContainer && navContainer.classList.contains('open')) {
      if (!navContainer.contains(e.target) && e.target !== hamburgerBtn && !hamburgerBtn.contains(e.target)) {
        navContainer.classList.remove('open');
      }
    }
  });

  // 绑定开始按钮
  var btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', function() {
      showPreTest();
    });
    console.log('✅ 开始按钮已绑定');
  } else {
    console.error('❌ 未找到 btn-start 元素');
  }

  // 尝试加载已保存的进度
  var hasSaved = loadProgress();
  if (hasSaved) {
    console.log('📂 已加载保存的进度');
    console.log('  徽章:', STATE.earnedBadges.length, '个');
    console.log('  答题进度:', STATE.quizIndex + '/' + (QUESTIONS.length || 5));
  }

  // 绑定清除进度按钮
  var clearBtn = document.getElementById('btn-clear-progress');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (confirm('确定要清除所有学习进度吗？这不会影响你的知识，只是重置闯关记录~')) {
        if (clearProgress()) {
          alert('✅ 进度已清除！');
          if (STATE.currentStation === 'station4') navigateTo('station4');
        }
      }
    });
  }

  // 显示首页
  navigateTo('home');
  console.log('✅ 初始化完成');
});
