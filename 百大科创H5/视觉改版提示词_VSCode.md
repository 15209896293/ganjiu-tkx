# 🎨 视觉改版：卡通→赛博科技

> **使用方式**：整个文件复制到VSCode DeepSeek，它会按顺序执行。

---

````
【项目信息】
纯HTML+CSS+JS项目，零框架，桌面端优先1200px。
文件结构：
  index.html  ← 主页面（首页+5站）
  css/style.css ← 样式（本次核心改动）
  js/data.js   ← 题库/时间轴数据
  js/api.js    ← DeepSeek API封装
  js/sound.js  ← 音效
  js/main.js   ← 核心交互逻辑

【⚠️ 铁律——违反任何一条都视为失败】
1. 不删除任何现有 id 属性
2. 不删除任何现有 class 属性（可以新增，不能删除/改名）
3. 不改动 HTML 中已有的 data-* 属性值
4. 不改动任何 .js 文件
5. 不改动 HTML 中任何 onclick / onkeydown 属性
6. HTML 只做"新增"操作（加canvas、加link标签等），不删除现有结构
7. 桌面端1200px布局保持不变
8. 移动端 44px 最小触控面积保持不变

【目标风格】
从"浅蓝+浅黄、大圆角、气泡对话框、卡通" →
"深色背景+霓虹蓝紫点缀、玻璃态卡片、工业无衬线字体、科技感"

--- 设计系统 ---

【色彩体系】
  背景：body background: linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%);
  卡片：background: rgba(255,255,255,0.04); backdrop-filter: blur(12px);
        border: 1px solid rgba(0,212,255,0.12);
  主色-霓虹蓝：#00D4FF
  辅色-紫色：#7B2CBF → #9B59B6
  成功色：#00FF88
  错误色：#FF4466
  警告色：#FFB800
  文字主色：#E8ECF1
  文字次色：#8899AA
  文字弱色：#556677

【字体】
  body: 'Inter', 'SF Pro Display', 'Noto Sans SC', '思源黑体', -apple-system, sans-serif;
  数字/代码: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
  引入方式（加在index.html <head>中）：
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">

【圆角】
  卡片: 6px（微圆角，告别卡通大圆角）
  按钮: 4px
  输入框: 4px

【阴影】
  卡片: box-shadow: 0 4px 24px rgba(0,212,255,0.06);
  悬停: box-shadow: 0 8px 40px rgba(0,212,255,0.15);
  按钮发光: box-shadow: 0 0 20px rgba(0,212,255,0.2);

--- CSS 完整改造清单 ---

【1. 全局重置 + Root变量】
  删除所有 :root 中的卡通配色变量，替换为上述色彩体系。
  body 加上深色渐变背景、新字体、新文字颜色。
  body 加 overflow-x:hidden。

【2. 背景粒子Canvas】
  在 body 最前面新增一个 <canvas id="bg-canvas"> 做粒子背景。
  CSS: #bg-canvas { position:fixed; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; }
  app-container 加 position:relative; z-index:1;

【3. 导航栏 .top-nav】
  改：background: rgba(10,14,39,0.8); backdrop-filter: blur(16px);
       border-bottom: 1px solid rgba(0,212,255,0.15);
  保持 sticky top:0
  .nav-brand 文字颜色 → #E8ECF1
  .nav-station 文字 → #8899AA，hover → #00D4FF
  .nav-station.active → background: rgba(0,212,255,0.15); color: #00D4FF;
                          border: 1px solid rgba(0,212,255,0.3);
  .hamburger-btn span → background: #00D4FF

【4. 移动端导航覆盖层】
  .nav-stations.open 背景 → rgba(10,14,39,0.97); backdrop-filter: blur(20px);
  .nav-station → background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  .nav-station.active → 同上霓虹蓝发光

【5. 首页 .home-*】
  .home-badge → background: rgba(0,212,255,0.1); color: #00D4FF;
                border: 1px solid rgba(0,212,255,0.2);
  .home-title → color: #E8ECF1; .highlight → color: #00D4FF;
                加 text-shadow: 0 0 40px rgba(0,212,255,0.3);
  .home-subtitle → color: #8899AA;
  .home-dialogue → 玻璃态卡片（见上方卡片样式），去掉 ::before 三角气泡伪元素
  .mascot-name → color: #00D4FF;
  .mascot-area → background: radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%);
                  border: 1px solid rgba(0,212,255,0.2);
  .inner-bot → 替换为科技芯片图标风格，保留 float 动画但改为 glow 脉冲动画

【6. 按钮系统 .btn】
  .btn → border-radius: 4px; font-weight: 600; transition: all 0.3s ease;
  .btn-primary → background: linear-gradient(135deg, #7B2CBF, #00D4FF);
                  color: #fff; border: none;
                  box-shadow: 0 0 20px rgba(0,212,255,0.25);
  .btn-primary:hover → transform: translateY(-2px);
                        box-shadow: 0 0 40px rgba(0,212,255,0.4);
  .btn-outline → background: transparent; color: #00D4FF;
                  border: 1px solid rgba(0,212,255,0.4);
  .btn-outline:hover → background: rgba(0,212,255,0.08);
                        border-color: #00D4FF;
                        box-shadow: 0 0 16px rgba(0,212,255,0.15);
  .btn-small → 保持尺寸逻辑，风格同上

【7. 各站页面 .page】
  保留 fadeSlideIn 动画，改为：
  @keyframes fadeSlideIn {
    from { opacity:0; transform: translateY(16px); filter: blur(4px); }
    to { opacity:1; transform: translateY(0); filter: blur(0); }
  }
  .station-number → background: rgba(0,212,255,0.15); color: #00D4FF;
  .station-title → color: #E8ECF1;
  .station-subtitle → color: #8899AA;

【8. 小D对话气泡 → 科技芯片风格】
  .xiaod-bubble → 玻璃态卡片样式（不再是暖黄色气泡！）
                  去掉 border-left 彩色条，改为整体发光边框
                  border: 1px solid rgba(0,212,255,0.2);
  .xiaod-bubble .bot-icon → 加 filter: drop-shadow(0 0 8px rgba(0,212,255,0.5));
  .xiaod-bubble .bot-text strong → color: #00D4FF;

【9. 卡片系统 .card / .lab-module / .quiz-card 等】
  所有白色卡片 → 玻璃态：
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0,212,255,0.1);
    border-radius: 6px;
  .card:hover → border-color: rgba(0,212,255,0.4);
                 box-shadow: 0 8px 32px rgba(0,212,255,0.12);
                 transform: translateY(-3px);
  .card.selected → border-color: #00D4FF;
                    background: rgba(0,212,255,0.08);
                    box-shadow: 0 0 24px rgba(0,212,255,0.15);
  .card-year → color: #00D4FF;
  .card-title → color: #E8ECF1;
  .card-desc → color: #8899AA;
  .card-easter → background: rgba(255,184,0,0.1); color: #FFB800;

【10. 数据喂养区 .data-feeder */
  .data-pool → background: rgba(255,255,255,0.03);
               border: 1px dashed rgba(0,212,255,0.2);
  .data-item → background: rgba(255,255,255,0.05);
               border: 1px solid rgba(255,255,255,0.08);
               color: #E8ECF1;
  .data-item:hover → border-color: rgba(0,212,255,0.3);
                     background: rgba(0,212,255,0.06);
  .data-item.dragging → opacity: 0.3; background: rgba(0,212,255,0.08);
  .drag-clone → box-shadow: 0 8px 32px rgba(0,212,255,0.3);
  .data-model → 保持深色但改为渐变：
                background: linear-gradient(135deg, rgba(123,44,191,0.2), rgba(0,212,255,0.1));
                border: 1px solid rgba(0,212,255,0.2);
  .data-model.drag-over → box-shadow: 0 0 0 3px #00D4FF, 0 0 60px rgba(0,212,255,0.4);
  .data-model .accuracy → color: #00D4FF; text-shadow: 0 0 20px rgba(0,212,255,0.4);

【11. API设置面板 */
  .api-key-panel details → background: rgba(255,255,255,0.03);
                           border: 1px solid rgba(0,212,255,0.1);
  .api-key-panel details[open] → border-color: rgba(0,212,255,0.3);
                                  background: rgba(0,212,255,0.04);
  .api-key-panel summary → color: #00D4FF;
  .api-key-form input → background: rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.1);
                        color: #E8ECF1;
  .api-key-form input:focus → border-color: #00D4FF;
                               box-shadow: 0 0 12px rgba(0,212,255,0.15);
  .api-key-hint → color: #556677;
  .api-key-status → color: #00D4FF;

【12. 决策树 */
  .tree-node → background: rgba(255,255,255,0.04);
               border: 1px solid rgba(255,255,255,0.08);
               color: #E8ECF1;
  .tree-node.question → border-color: rgba(0,212,255,0.3);
                        background: rgba(0,212,255,0.05);
  .tree-node.result-good → border-color: #00FF88;
                            background: rgba(0,255,136,0.05);
  .tree-node.result-bad → border-color: #FF4466;
                           background: rgba(255,68,102,0.05);
  .tree-option → background: rgba(255,255,255,0.04);
                 border: 1px solid rgba(255,255,255,0.1);
                 color: #8899AA;
  .tree-option:hover → border-color: #00D4FF; color: #E8ECF1;
  .tree-option.selected → border-color: #00D4FF;
                           background: rgba(0,212,255,0.1);
                           color: #00D4FF;

【13. 偏见实验室 */
  .bias-column → background: rgba(255,255,255,0.03);
                 border: 1px solid rgba(255,255,255,0.06);
  .bias-btn.train → background: linear-gradient(135deg, #7B2CBF, #00D4FF);
                     box-shadow: 0 0 16px rgba(0,212,255,0.2);
  .bias-result.biased → background: rgba(255,68,102,0.08);
                         border-color: rgba(255,68,102,0.3);
                         color: #FF4466;
  .bias-result.fair → background: rgba(0,255,136,0.08);
                       border-color: rgba(0,255,136,0.3);
                       color: #00FF88;

【14. AI实验室模块 */
  .lab-grid 保持grid布局
  .lab-module → 玻璃态卡片
  .lab-module:hover → border-color: #00D4FF;
                       box-shadow: 0 0 24px rgba(0,212,255,0.15);
  .lab-module .lab-icon → 保留
  .lab-module h4 → color: #E8ECF1;
  .lab-module p → color: #8899AA;
  .lab-area → 玻璃态背景
  .lab-input-area input → 深色输入框风格（同API key输入框）
  .lab-response → background: rgba(255,255,255,0.03);
                  color: #CCD4DD;
  .lab-response .ai-loading → 文字颜色适配
  .lab-response .ai-error → color: #FF4466;
  .loading-dot → color: #00D4FF;

【15. 答题系统 */
  .quiz-card → 玻璃态卡片
  .quiz-level → color: #556677;
  .quiz-question → color: #E8ECF1;
  .quiz-option → background: rgba(255,255,255,0.04);
                 border: 1px solid rgba(255,255,255,0.08);
                 color: #CCD4DD;
  .quiz-option:hover → border-color: rgba(0,212,255,0.3);
                        background: rgba(0,212,255,0.05);
  .quiz-option.correct → border-color: #00FF88;
                          background: rgba(0,255,136,0.08);
                          color: #00FF88;
  .quiz-option.wrong → border-color: #FF4466;
                        background: rgba(255,68,102,0.08);
                        color: #FF4466;
  .quiz-feedback.correct → background: rgba(0,255,136,0.08); color: #00FF88;
  .quiz-feedback.wrong → background: rgba(255,68,102,0.08); color: #FF4466;

【16. 徽章墙 */
  .badge-wall → 保持flex布局
  .badge-item → background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
                opacity: 0.3;
  .badge-item.earned → opacity: 1;
                        background: rgba(0,212,255,0.08);
                        border-color: rgba(0,212,255,0.3);
                        box-shadow: 0 0 16px rgba(0,212,255,0.1);
  .badge-name → color: #E8ECF1;
  .badge-desc → color: #556677;

【17. 成长曲线 */
  .growth-display → background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
  .growth-bar.pre → background: rgba(255,255,255,0.1);
  .growth-bar.post → background: linear-gradient(to top, #00D4FF, #7B2CBF);
                      box-shadow: 0 0 20px rgba(0,212,255,0.3);
  .growth-label → color: #8899AA;
  .growth-score → color: #00D4FF;

【18. 教师贴士 + insight提示框 */
  .teacher-tip → background: rgba(0,212,255,0.05);
                 border-left: 3px solid #00D4FF;
                 color: #8899AA;
  #feeding-insight, #tree-insight, #bias-insight → 
                 background: rgba(0,212,255,0.05);
                 border: 1px solid rgba(0,212,255,0.12);
                 color: #CCD4DD;
  resource-section h3 → color: #E8ECF1; border-bottom-color: rgba(255,255,255,0.08);
  .resource-list li → color: #8899AA; border-bottom-color: rgba(255,255,255,0.04);
  .resource-list li::before → color: #00D4FF;

【19. 弹窗 */
  .modal-overlay → background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  .modal-box → 玻璃态卡片

【20. 打印样式 */
  保持不变

【21. Canvas 神经网络 */
  #neural-canvas → background: rgba(0,0,0,0.3) !important;
                   border: 1px solid rgba(0,212,255,0.15) !important;

--- HTML 需要新增的部分 ---

【A. 字体引入】
在 <head> 中，viewport meta 之后，加入上面三个 Google Fonts link 标签。

【B. 背景粒子Canvas】
在 <body> 最开头（<div class="app-container"> 之前）加：
<canvas id="bg-canvas"></canvas>

【C. 首页标题加光条扫描效果】
给 .home-title 加一个子元素或伪元素由CSS处理，不用改HTML结构。
用CSS ::after 伪元素实现光条扫描：
.home-title {
  position: relative;
  overflow: hidden;
}
.home-title::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60px; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent);
  animation: titleScan 3s ease-in-out infinite;
}
@keyframes titleScan {
  0% { left: -100%; }
  50% { left: 120%; }
  100% { left: 120%; }
}

--- 背景粒子 JS ---

请在 js/ 下新建一个 particle-bg.js，然后在 index.html 的 </body> 前引入：
<script src="js/particle-bg.js"></script>

particle-bg.js 完整代码：

/* ============================================================
   百大科创 H5 —— 轻量粒子背景
   深色科技风，Canvas 实现，60fps
   ============================================================ */
(function() {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var PARTICLE_COUNT = 60;    // 粒子数量（轻量）
  var CONNECT_DIST = 120;     // 连线距离

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // 创建粒子
  for (var i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 更新和绘制粒子
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // 边界回弹
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      // 连线到附近粒子
      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x;
        var dy = p.y - q.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(0,212,255,' + (0.06 * (1 - dist / CONNECT_DIST)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // 绘制粒子
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,' + p.alpha + ')';
      ctx.fill();

      // 偶尔紫色粒子
      if (i % 7 === 0) {
        ctx.fillStyle = 'rgba(123,44,191,' + p.alpha + ')';
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

--- 移动端适配保留 ---

所有 @media 断点（1024px / 768px / 480px）保持，但更新配色变量：
- 导航玻璃态背景在移动端菜单中保持
- 44px 最小触控区域不变
- 按钮/选项最小高度保持 48px（768px下）/ 44px（480px下）
- 深色背景下对比度确保可读性

--- 输出要求 ---

请按顺序输出：
1. "=== style.css 完整替换 ===" 然后给全新CSS文件
2. "=== index.html 需要新增/修改的部分 ===" 列出具体改动（哪个位置加什么）
3. "=== particle-bg.js ===" 粘贴上述粒子JS代码
4. "=== 改动总结 ===" 列出改了哪些文件、新增了什么、确认没动的JS功能
````
