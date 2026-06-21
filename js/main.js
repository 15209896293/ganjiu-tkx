(function(){
  var canvas=document.getElementById('ecgCanvas');
  var ctx=canvas.getContext('2d');
  var bootDot=document.getElementById('bootDot');
  var bootBrand=document.getElementById('bootBrand');
  var lightBurst=document.getElementById('lightBurst');
  var textFlow=document.getElementById('textFlow');
  var choiceCard=document.getElementById('choiceCard');
  var btnR=document.getElementById('btnR');
  var btnP=document.getElementById('btnP');
  var comfortOv=document.getElementById('comfortOv');
  var ccBtn=document.getElementById('ccBtn');

  var startTime=Date.now();
  var decisionMade=false;
  var transitioning=false;
  var transStart=0;
  var W,H,baseline;

  function lerp(a,b,t){return a+(b-a)*t}
  function clamp(v,lo,hi){return v<lo?lo:v>hi?hi:v}
  function easeInOut(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2}

  function resize(){
    W=window.innerWidth;H=window.innerHeight;
    canvas.width=W*devicePixelRatio;canvas.height=H*devicePixelRatio;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    baseline=H*0.62;
  }
  window.addEventListener('resize',resize);resize();

  function normalBeat(t, ampVar){
    var y=0;
    var av=ampVar||1;
    y+=3.5*av*Math.exp(-Math.pow((t-0.10)*28,2));
    y-=4.0*av*Math.exp(-Math.pow((t-0.19)*45,2));
    y+=85.0*av*Math.exp(-Math.pow((t-0.23)*35,2));
    y-=9.0*av*Math.exp(-Math.pow((t-0.27)*30,2));
    y+=8.0*av*Math.exp(-Math.pow((t-0.42)*9,2));
    return y;
  }

  function pvcBeat(t){
    var y=0;
    y+=28.0*Math.exp(-Math.pow((t-0.25)*12,2));
    y-=6.0*Math.exp(-Math.pow((t-0.32)*16,2));
    return y;
  }

  function vfibWave(t, intensity){
    var y=0;
    y+=8.0*Math.sin(t*Math.PI*2*8.0)*intensity;
    y+=6.0*Math.sin(t*Math.PI*2*12.0+1.2)*intensity;
    y+=4.0*Math.sin(t*Math.PI*2*15.0+2.5)*intensity;
    y+=3.0*Math.sin(t*Math.PI*2*1.5)*intensity;
    return y;
  }

  function noise(x){
    var n=Math.sin(x*127.1+311.7)*43758.5453;
    return(n-Math.floor(n))*2-1;
  }

  var beatParams=[];
  function getBeatParams(beatIndex){
    if(!beatParams[beatIndex]){
      var seed=beatIndex*7.3+11;
      beatParams[beatIndex]={
        ampVar:0.9+Math.sin(seed)*0.2,
        intervalVar:0.8+Math.sin(seed*2.1)*0.08
      };
    }
    return beatParams[beatIndex];
  }

  function getECG(t){
    var hr=72, amp=1, lw=2.5, r=61,g=213,b=152, alpha=0.32, glow=10;
    var flatline=false;
    var beatType='normal';

    if(t<0.3){
      hr=58;amp=1;r=61;g=200;b=152;alpha=0.08;glow=4;beatType='normal';
    }else if(t<0.8){
      hr=58;amp=1;r=61;g=200;b=152;alpha=0.12;glow=5;beatType='normal';
    }else if(t<1.5){
      hr=72;amp=1;r=61;g=213;b=152;alpha=0.32;beatType='normal';
    }else if(t<2.2){
      hr=72;amp=1;r=61;g=213;b=152;beatType='pvc';
    }else if(t<3.5){
      var p=(t-2.2)/1.3;
      hr=lerp(72,180,p);
      amp=lerp(1,0.55,p);
      r=Math.round(lerp(61,229,p));
      g=Math.round(lerp(213,57,p));
      b=Math.round(lerp(152,53,p));
      glow=lerp(10,24,p);
      beatType='vfib';
    }else if(t<4.2){
      flatline=true;
      r=160;g=48;b=48;alpha=0.1;glow=3;
    }else if(t<5.5){
      var p=(t-4.2)/1.3;
      hr=lerp(35,72,p);
      amp=lerp(0.15,1,p);
      r=Math.round(lerp(160,61,p));
      g=Math.round(lerp(48,213,p));
      b=Math.round(lerp(48,152,p));
      alpha=lerp(0.15,0.32,p);
      glow=lerp(3,10,p);
      beatType='recovery';
    }else{
      hr=72;amp=1;r=61;g=213;b=152;alpha=0.32;glow=10;beatType='normal';
    }

    if(transitioning){
      hr=140;amp=2.0;lw=5;r=255;g=60;b=60;alpha=0.95;glow=45;beatType='normal';
    }

    return{hr:hr,amp:amp,lw:lw,r:r,g:g,b:b,alpha:alpha,glow:glow,flatline:flatline,beatType:beatType};
  }

  var scrollSpeed=180;
  function drawECG(elapsed){
    ctx.clearRect(0,0,W,H);
    var p=getECG(elapsed);
    var col='rgba('+p.r+','+p.g+','+p.b+','+p.alpha+')';

    if(p.flatline){
      if(p.alpha>0.005){
        ctx.beginPath();
        ctx.strokeStyle=col;
        ctx.lineWidth=1.5;
        ctx.shadowColor='rgba('+p.r+','+p.g+','+p.b+','+(p.glow/100)+')';
        ctx.shadowBlur=p.glow;
        ctx.moveTo(0,baseline);
        for(var x=0;x<W;x+=4){
          var ft=elapsed-(W-x)/scrollSpeed;
          if(ft<0)ft=0;
          var wobble=Math.sin(ft*4.0)*p.alpha*1.5;
          ctx.lineTo(x,baseline+wobble);
        }
        ctx.stroke();
        ctx.shadowBlur=0;
      }
    }else{
      ctx.beginPath();
      ctx.strokeStyle=col;
      ctx.lineWidth=p.lw;
      ctx.shadowColor='rgba('+p.r+','+p.g+','+p.b+','+(p.glow/100)+')';
      ctx.shadowBlur=p.glow;
      ctx.lineJoin='round';ctx.lineCap='round';

      for(var x=0;x<W;x+=2){
        var t=elapsed-(W-x)/scrollSpeed;
        if(t<0)t=0;
        var pp=getECG(t);
        var y=0;

        if(!pp.flatline){
          var cycleDur=60/pp.hr;
          var beatIndex=Math.floor(t/cycleDur);
          var params=getBeatParams(beatIndex);
          var adjustedCycleDur=cycleDur*params.intervalVar;
          var cycleT=(t%adjustedCycleDur)/adjustedCycleDur;

          if(pp.beatType==='vfib'){
            var intensity=clamp((t-2.2)/1.3,0,1);
            y=vfibWave(t,intensity)*pp.amp;
          }else if(pp.beatType==='pvc'){
            y=normalBeat(cycleT,params.ampVar)*pp.amp;
            if(cycleT>0.30&&cycleT<0.55){
              var pvcT=(cycleT-0.30)/0.25;
              y=pvcBeat(pvcT)*pp.amp*0.9;
            }
          }else if(pp.beatType==='recovery'){
            y=normalBeat(cycleT,params.ampVar)*pp.amp;
            y+=Math.sin(t*6.0)*0.8*(1-pp.amp);
          }else{
            y=normalBeat(cycleT,params.ampVar)*pp.amp;
          }
          y+=noise(t*2.1)*0.6;
        }
        if(x===0)ctx.moveTo(x,baseline-y);
        else ctx.lineTo(x,baseline-y);
      }
      ctx.stroke();
      ctx.shadowBlur=0;
    }
  }

  function startTransition(){
    if(transitioning)return;
    transitioning=true;
    transStart=Date.now();
  }

  var _done = false;
  function drawTransition(){
    if(!transitioning || _done) return;
    var elapsed = (Date.now()-transStart)/1000;
    // Phase 1: white burst
    if(elapsed <= 0.8){
      var t = easeInOut(clamp(elapsed/0.7, 0, 1));
      var spreadY = t*140;
      var spreadX = t*100;
      lightBurst.style.opacity = t;
      lightBurst.style.background = 'radial-gradient(ellipse '+spreadX+'% '+spreadY+'% at 50% 55%,rgba(255,255,255,'+(0.98*t)+'),rgba(255,255,255,'+(0.45*t)+') 40%,transparent 70%)';
      return;
    }
    // Phase 2: fade out overlay + cleanup intro styles
    var introLayer = document.getElementById('introLayer');
    var introStyle = document.getElementById('introStyle');
    var fadeT = clamp((elapsed-0.8)/0.5, 0, 1);
    if(introLayer) introLayer.style.opacity = String(1-fadeT);
    // Phase 3: remove overlay from DOM
    if(elapsed > 1.35){
      if(introLayer && introLayer.parentNode) introLayer.parentNode.removeChild(introLayer);
      if(introStyle && introStyle.parentNode) introStyle.parentNode.removeChild(introStyle);
      _done = true;
    }
  }

  /* ===== 开机：圆点 → 品牌名 → 消失 ===== */
  setTimeout(function(){bootDot.classList.add('visible')},100);
  setTimeout(function(){bootDot.classList.remove('visible')},400);
  setTimeout(function(){bootBrand.classList.add('visible')},500);
  setTimeout(function(){bootBrand.classList.remove('visible')},1200);

  /* ===== 文字流时序 ===== */
  function showLine(id,delay){setTimeout(function(){var el=document.getElementById(id);if(el)el.classList.add('visible')},delay)}
  function dimLines(ids,delay){setTimeout(function(){ids.forEach(function(id){var el=document.getElementById(id);if(el)el.classList.add('dim')})},delay)}

  showLine('l1',800);
  dimLines(['l1'],2200);

  showLine('l2',1800);
  dimLines(['l2'],3200);

  showLine('l3',2800);
  dimLines(['l3'],4200);

  showLine('l4',3800);
  dimLines(['l4'],5200);

  showLine('l5',4800);
  dimLines(['l5'],6200);

  showLine('l6',5800);

  /* 抉择卡片：文字模糊，卡片浮现 */
  setTimeout(function(){
    textFlow.classList.add('blur');
    choiceCard.classList.add('visible');
  },7000);

  /* 按钮交互 */
  btnR.addEventListener('click',function(){
    if(decisionMade)return;
    decisionMade=true;
    startTransition();
  });
  btnP.addEventListener('click',function(){
    if(decisionMade)return;
    decisionMade=true;
    choiceCard.classList.remove('visible');
    setTimeout(function(){comfortOv.classList.add('visible')},300);
  });
  ccBtn.addEventListener('click',function(){
    startTransition();
  });
  document.addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&choiceCard.classList.contains('visible')&&!decisionMade){
      e.preventDefault();btnR.click();
    }
  });

  function loop(){
    if(_done) return;
    var elapsed = (Date.now()-startTime)/1000;
    drawECG(elapsed);
    drawTransition();
    if(!_done) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ============================================================
   JavaScript — 敢救 全引擎
   ============================================================ */
(function() {
'use strict';

// ==========================================================
// Utility
// ==========================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

// ==========================================================
// 0. Global onclick handlers — always available
// ==========================================================
// Page navigation helpers (global scope, always available)
window._goTo = (n) => { goToPage(n); };
window._startTraining = () => { Audio.init(); goToPage(2); };
window._completeEnv = () => { state.completed[3] = true; goToPage(4); };

window._cprCallSubmit = () => {}; // Deprecated; conversation system replaces this

// ── 120 Call Conversation System ──
let callRound = 0, callScore = 0, callTimerInterval = null, callSeconds = 0;

function startCallConversation() {
  callRound = 0; callScore = 0; callSeconds = 0;
  $('#callTimer').textContent = '00:00';
  $('#callChat').innerHTML = '';
  $('#callFeedback').className = 'quiz-feedback'; $('#callFeedback').style.display = 'none';
  // Start ambient phone static noise
  Audio.callStaticStart();
  if (callTimerInterval) clearInterval(callTimerInterval);
  callSeconds = 0;
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const m = Math.floor(callSeconds / 60), s = callSeconds % 60;
    $('#callTimer').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    if (callSeconds >= 30) { showToast('⏰ 通话已超30秒，自动进入下一步', 'info'); endCallConversation(); window._cprGoToPage5(); }
  }, 1000);
  nextCallRound();
}

function endCallConversation() {
  Audio.callStaticStop();
  if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
  callSeconds = 0;
}

function addChatBubble(who, text) {
  const container = $('#callChat');
  const div = document.createElement('div');
  div.className = 'chat-bubble ' + who;
  div.innerHTML = '<div class="bubble-avatar">' + (who === 'dispatcher' ? '🏥' : '👤') + '</div><div class="bubble-body">' + text + '</div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  if (who === 'dispatcher') speak(text.replace(/<[^>]*>/g, ''), 'dispatcher');
}

function showCallOptions(opts) { shuffle(opts);
  const container = $('#callOptions');
  container.innerHTML = '';
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'call-option-btn';
    btn.textContent = opt.label;
    btn.onclick = () => {
      addChatBubble('user', opt.label);
      container.innerHTML = '';
      if (opt.ok) {
        callScore += opt.pts || 5;
        btn.classList.add('correct');
        setTimeout(() => nextCallRound(), 300);
      } else {
        btn.classList.add('wrong');
        pushRisk({type:'call', action:opt.risk || '呼救信息不完整', risk:'救援调度可能延误', correct:'清晰告知地点+症状', knowledge:'call', tip:'呼救要说明地点和患者情况'});
        showModal({
          type: 'warning',
          title: '⚠️ 呼救信息不完整',
          text: (opt.risk || '') + '<br><br><b>正确做法：</b>' + (opt.tip || '清晰告知地点和患者症状') + '<br><br>请重新选择正确的回复。',
          confirmText: '重新选择',
          onConfirm: () => { showCallOptions(opts); }
        });
      }
    };
    container.appendChild(btn);
  });
}

function nextCallRound() {
  callRound++;
  $('#callOptions').innerHTML = '';
  if (callRound === 1) {
    var sceneIntros = {park:'公园散步时有人倒地',court:'球场上有人突然倒下',bathroom:'浴室有人触电倒地',subway:'地铁站有人突然倒地',home:'家里老人倒地不醒'};
    var intro = sceneIntros[state.sceneType] || '有人突然晕倒';
    addChatBubble('dispatcher', '幺二零急救中心。<br>请讲。');
    showCallOptions([
      {label:'🏃 ' + intro + '，没有反应！需要救护车！', ok:true, pts:3},
      {label:'😰 有人晕倒了！我不知道该怎么办，快来救人！', ok:false, risk:'未说明具体情况，调度员无法判断', tip:'冷静描述：有人晕倒、无反应'},
	      {label:'📞 你好，请问是120吗？确认一下号码。', ok:false, risk:'浪费救援时间', tip:'直接说明紧急情况，不要浪费时间'},
      {label:'📱 有人躺地上了……但我害怕不敢靠近，你们快来吧。', ok:false, risk:'未确认患者状态，调度员无法判断是否需要CPR', tip:'靠近患者，观察是否有反应和呼吸，报告给调度员'},
      {label:'🚑 他好像没反应了……但是我也不太确定，可能只是晕过去了？', ok:false, risk:'描述模糊，可能低估心脏骤停风险', tip:'不确定时宁可当作最严重情况处理：无反应+无呼吸=立即CPR'},
    ]);
  } else if (callRound === 2) {
    addChatBubble('dispatcher', '说重点！<b>地点</b>在哪？<b>患者什么情况</b>？');
    // Scene-aware location options
    var sceneLocations = {
      park: { correct: '📍 我在公园长椅旁，老人无呼吸无意识！', ok: true, pts: 4, label: '公园' },
      court: { correct: '📍 XX篮球场，球友突然倒地，无呼吸！', ok: true, pts: 4, label: '球场' },
      bathroom: { correct: '📍 我家里浴室！家人触电倒地，我已断电！', ok: true, pts: 4, label: '浴室' },
      subway: { correct: '📍 XX线XX站B2层站台！有人倒地无呼吸！', ok: true, pts: 4, label: '地铁站' },
      home: { correct: '📍 XX小区X栋X号，老人在家倒地！', ok: true, pts: 4, label: '家中' }
    };
    var sl = sceneLocations[state.sceneType] || sceneLocations.park;
    showCallOptions([
      {label: sl.correct, ok: sl.ok, pts: sl.pts},
      {label: '📍 有人晕倒了，你们快来！具体位置我发定位。', ok: true, pts: 2},
      {label:'📍 就在那个公园啊！你们导航过来就行了，不用问那么多。', ok:false, pts:0, risk:'未提供具体地址——救援车辆无法定位', tip:'清晰说出地址：街道名+小区名+楼号+楼层'},
      {label:'🏃 你们快点来就行了，问那么多干什么！我挂了！', ok:false, pts:0, risk:'挂断电话会导致调度员无法指导急救', tip:'保持通话！调度员会指导你做CPR——不要挂断'},
      {label: '我不知道这是哪！你们快点派人来！', ok: false, pts: 0, risk: '未提供地点，救援无法定位'}
    ]);
  } else if (callRound === 3) {
    // Scene-aware AED guidance
    var aedHints = {park:'公园游客中心或保安亭通常有AED！',court:'场馆前台和医疗室有AED，快去取！',bathroom:'家中没有AED，持续按压等救护车！',subway:'站台两端有橙色AED箱！让工作人员去取！',home:'让家人去小区物业看看有没有AED！'};
    var aedHint = aedHints[state.sceneType] || '让附近人帮忙找AED！';
    addChatBubble('dispatcher', '好的，救护车已派出，预计很快到达。<br><b>' + aedHint + '</b><br>请保持电话畅通，我会指导你。');
    state.scores.call = Math.min(10, callScore);
    endCallConversation();
    Audio.ding(); showToast('+' + state.scores.call + ' 分', 'success');
    $('#callFeedback').className = 'quiz-feedback success show';
    $('#callFeedback').textContent = '✅ 通话完成！120已派出救护车。得分：' + state.scores.call;
    $('#callFeedback').style.display = 'block';
    setTimeout(() => startAedWait(), 800);
  }
}

function startAedWait() {
  try { $('#aedWaitCard').style.display = 'block'; } catch(ex) {}
  state.aedWaitRemaining = 8;
  try { $('#aedTimer').textContent = '8'; } catch(ex) {}
  if (aedTimerInterval) clearInterval(aedTimerInterval);
  aedTimerInterval = setInterval(() => {
    state.aedWaitRemaining--;
    try { $('#aedTimer').textContent = state.aedWaitRemaining; } catch(ex) {}
    if (state.aedWaitRemaining <= 0) {
      clearInterval(aedTimerInterval); aedTimerInterval = null;
      try { $('#aedWaitCard').style.display = 'none'; $('#aedArrived').style.display = 'block'; } catch(ex) {}
      Audio.ding(); showToast('AED 已到达！', 'success');
    }
  }, 1000);
}
window._cprSkipAedWait = () => {
  if (aedTimerInterval) { clearInterval(aedTimerInterval); aedTimerInterval = null; }
  try { $('#aedWaitCard').style.display = 'none'; $('#aedArrived').style.display = 'block'; } catch(e) {}
  Audio.ding();
};
window._cprGoToPage5 = () => {
  if (aedTimerInterval) { clearInterval(aedTimerInterval); aedTimerInterval = null; }
  state.completed[4] = true;
  goToPage(5);
};

// ==========================================================
// 1. Global State (单一数据源)
// ==========================================================
const state = {
  currentPage: 1,
  mainPosition: 1,
  pageHistory: [],
  sceneType: null,
  totalTime: 0,
  timerInterval: null,
  timerRunning: false,
  aedWaitRemaining: 60,
  scores: {
    env: 0, call: 0, breathCheck: 0,
    compression: 0, rescueBreath: 0,
    aed: 0, cycle: 0, timeBonus: 0
  },
  compressionData: {
    timestamps: [], depthValues: [], rateValues: [],
    depthResults: [], rateResults: [],
    reboundViolations: 0, totalPresses: 0,
    depthOkCount: 0, rateOkCount: 0,
    positionOkCount: 0, interruptionCount: 0,
    totalInterruptionTime: 0,
    avgBpm: 0, avgDepth: 0,
    depthGoodRate: 0, rateGoodRate: 0,
    correctPresses: 0,
    pressStartTime: 0, lastPressTime: 0
  },
  cycleCount: 0,
  cycleRound: 0,
  fatigueTriggered: false,
  sortRetry: false,
  aedStep: 0,
  aedPadsPlaced: {},
  completed: {},
  vibrationEnabled: true,
  bestScore: 0,
  totalAttempts: 0,
  checkStep: 0,
  riskEvents: [],
  timeoutWarned: false,
};
// Risk event recording helper
function pushRisk(evt) {
  state.riskEvents = state.riskEvents || [];
  var key = (evt.type||'') + '|' + (evt.action||'');
  var existing = null;
  for (var i = 0; i < state.riskEvents.length; i++) {
    var r = state.riskEvents[i];
    if (((r.type||'') + '|' + (r.action||'')) === key) { existing = r; break; }
  }
  if (existing) {
    existing.count = (existing.count || 1) + 1;
    if (existing.count > 2) return existing; // 继续计数但不再更新详情
    existing.risk = evt.risk || existing.risk;
    existing.correct = evt.correct || existing.correct;
    existing.knowledge = evt.knowledge || existing.knowledge;
    existing.tip = evt.tip || existing.tip;
    return existing;
  }
  evt.count = 1;
  state.riskEvents.push(evt);
  return evt;
}
// Render risk replay card
function showRiskReplay(pageNum, evt) {
  var el = $('#riskReplayP' + pageNum);
  if (!el) return;
  pushRisk(evt);
  el.innerHTML =
    '<div class="rr-title">⚠️ 风险回放</div>' +
    '<div class="rr-row"><span class="rr-label">错误行为：</span>' + evt.action + '</div>' +
    '<div class="rr-row"><span class="rr-label">潜在风险：</span>' + evt.risk + '</div>' +
    '<div class="rr-row"><span class="rr-label">正确处理：</span><span class="rr-correct">' + evt.correct + '</span></div>' +
    (evt.tip ? '<div class="rr-knowledge">💡 ' + evt.tip + '</div>' : '');
  el.classList.add('show');
}

// ==========================================================

// ==========================================================
// 2. Audio Engine (Web Audio API)
// ==========================================================
const Audio = {
  ctx: null,
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(freq, type, duration, gainVal, delay = 0, attack = 0.005, release = 0.03) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + attack);
    gain.gain.setValueAtTime(gainVal, now + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + duration + 0.01);
  },
  beepStart() { this.play(880, 'sine', 0.15, 0.25); },
  clickGood() { this.play(80, 'sine', 0.12, 0.4); },
  clickBad() { this.play(1200, 'triangle', 0.05, 0.15); },
  ding() { this.play(880, 'sine', 0.12, 0.25); setTimeout(() => this.play(1100, 'sine', 0.15, 0.2), 80); },
  buzzer() { this.play(200, 'sawtooth', 0.2, 0.15); },
  shock() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    src.connect(g); g.connect(this.ctx.destination); src.start(now); src.stop(now + 0.31);
  },
  cheer() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.play(f, 'sine', 0.25, 0.2), i * 100));
  },
  metronome() { this.drumBeat(); },
  drumBeat() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    // 底鼓——低频"咚"声（模拟心跳/鼓点）
    var kick = this.ctx.createOscillator(); var kickGain = this.ctx.createGain();
    kick.type = 'sine'; kick.frequency.setValueAtTime(150, now);
    kick.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    kickGain.gain.setValueAtTime(0.6, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    kick.connect(kickGain); kickGain.connect(this.ctx.destination);
    kick.start(now); kick.stop(now + 0.2);
    // 轻拍——中频"哒"声（模拟拍点/掌声）
    var snap = this.ctx.createOscillator(); var snapGain = this.ctx.createGain();
    snap.type = 'triangle'; snap.frequency.setValueAtTime(800, now);
    snap.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    snapGain.gain.setValueAtTime(0.15, now + 0.005);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    snap.connect(snapGain); snapGain.connect(this.ctx.destination);
    snap.start(now + 0.005); snap.stop(now + 0.08);
    // 短噪——模拟沙锤/节奏感
    var buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) { d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008)); }
    var noise = this.ctx.createBufferSource(); noise.buffer = buf;
    var noiseGain = this.ctx.createGain(); noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    noise.connect(noiseGain); noiseGain.connect(this.ctx.destination);
    noise.start(now); noise.stop(now + 0.05);
  },
  flatline() { this.play(1000, 'sine', 1.0, 0.3); },
  callStaticNode: null, callStaticGain: null,
  callStaticStart() {
    if (!this.ctx) return;
    if (this.callStaticNode) return;
    const bufSize = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.02;
    this.callStaticNode = this.ctx.createBufferSource();
    this.callStaticNode.buffer = buf; this.callStaticNode.loop = true;
    this.callStaticGain = this.ctx.createGain();
    this.callStaticGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    this.callStaticNode.connect(this.callStaticGain);
    this.callStaticGain.connect(this.ctx.destination);
    this.callStaticNode.start();
  },
  callStaticStop() {
    if (this.callStaticNode) {
      try { this.callStaticNode.stop(); } catch(e) {}
      this.callStaticNode = null; this.callStaticGain = null;
    }
  },
};

// ==========================================================
// 3. Vibration Manager
// ==========================================================
const Vibe = {
  vibrate(pattern) {
    if (!state.vibrationEnabled) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch(e) {}
    }
  },
  good() { this.vibrate(30); },
  shallow() { this.vibrate(10); },
  deep() { this.vibrate([10, 50, 10]); },
  warn() { this.vibrate(100); },
};

// ==========================================================
// 4. Timer Manager
// ==========================================================
const Timer = {
  start() {
    if (state.timerRunning) return;
    state.timerRunning = true;
    const startTime = Date.now() - state.totalTime * 1000;
    state.timerInterval = setInterval(() => {
      state.totalTime = Math.floor((Date.now() - startTime) / 1000);
      this.updateDisplay();
      if (state.totalTime >= 600 && !state.timeoutWarned) {
        state.timeoutWarned = true;
        pushRisk({
          type: 'process',
          action: '训练总时长超过10分钟',
          risk: '真实急救中每延迟1分钟存活率下降7-10%',
          correct: '在确保安全的前提下尽快完成呼救与CPR',
          knowledge: 'process',
          tip: '日常练习可逐渐缩短至5分钟内完成'
        });
        showToast('训练已超过10分钟，建议加快速度，但请继续完成后续步骤');
      }
      if (state.totalTime >= 540) {
        $('#headerTimer').classList.add('urgent');
      }
    }, 1000);
  },
  stop() {
    state.timerRunning = false;
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  },
  reset() {
    this.stop();
    state.totalTime = 0;
    $('#headerTimer').classList.remove('urgent');
    this.updateDisplay();
  },
  updateDisplay() {
    const m = Math.floor(state.totalTime / 60);
    const s = state.totalTime % 60;
    $('#globalTimer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
};

// ==========================================================
// 5. Storage Manager
// ==========================================================
const Storage = {
  key: 'emergencyHero',
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : {};
    } catch(e) {
      // localStorage disabled — fallback to in-memory store
      window._memStore = window._memStore || {};
      return window._memStore[this.key] || {};
    }
  },
  save(data) {
    try {
      const existing = this.load();
      localStorage.setItem(this.key, JSON.stringify({ ...existing, ...data }));
    } catch(e) {
      // localStorage disabled — fallback to in-memory store
      window._memStore = window._memStore || {};
      var ex = window._memStore[this.key] || {};
      window._memStore[this.key] = Object.assign(ex, data);
    }
  },
  getBestScore() {
    const d = this.load();
    return d.bestScore || 0;
  },
  setBestScore(score) {
    if (score > this.getBestScore()) {
      this.save({ bestScore: score });
    }
  },
  getTotalAttempts() {
    return (this.load()).totalAttempts || 0;
  },
  incrementAttempts() {
    const d = this.load();
    this.save({ totalAttempts: (d.totalAttempts || 0) + 1 });
  }
};

// ==========================================================
// 6. Modal System
// ==========================================================
function showModal(opts = {}) {
  const { type = 'info', title = '', text = '', confirmText = '知道了', cancelText = '取消', onConfirm, onCancel } = opts;
  const icons = { info: 'ℹ️', warning: '⚠️', confirm: '❓' };
  $('#modalIcon').textContent = icons[type] || icons.info;
  $('#modalTitle').textContent = title;
  $('#modalText').innerHTML = text;
  $('#modalBtns').innerHTML = '';
  $('#modalBtns').style.display = ''; // Reset inline display:none from sorting quiz
  const overlay = $('#modal-overlay');

  if (type === 'confirm') {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn--ghost'; cancelBtn.textContent = cancelText;
    cancelBtn.onclick = () => { overlay.classList.remove('active'); if (onCancel) onCancel(); };
    $('#modalBtns').appendChild(cancelBtn);
  }

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn--primary'; confirmBtn.textContent = confirmText;
  confirmBtn.onclick = () => { overlay.classList.remove('active'); if (onConfirm) onConfirm(); };
  $('#modalBtns').appendChild(confirmBtn);

  overlay.classList.add('active');
}

// Safety confirmation helper — blocks progress until confirmed
function showSafetyConfirm(message, onConfirm) {
  showModal({
    type: 'confirm',
    title: '⚠️ 安全确认',
    text: '<p style="line-height:1.8;font-size:0.95rem;">' + message + '</p><p style="font-size:0.75rem;color:var(--c-danger);margin-top:8px;">⛔ 未确认将无法继续操作</p>',
    confirmText: '✅ 已确认，继续',
    cancelText: '返回',
    onConfirm: onConfirm,
    onCancel: function() { showToast('请确认安全后再继续', 'info'); }
  });
}

// ==========================================================
// 7. Toast Feedback
// ==========================================================
function showVideoList() {
  const videos = [
    { title: '成人心肺复苏操作流程', url: 'https://search.bilibili.com/all?keyword=成人心肺复苏+CPR+操作流程', src: 'B站搜索' },
    { title: 'AED使用教学——人人都能学会', url: 'https://search.bilibili.com/all?keyword=AED+自动体外除颤器+使用教学', src: 'B站搜索' },
    { title: '中国红十字会急救科普——心肺复苏', url: 'https://search.bilibili.com/all?keyword=中国红十字会+心肺复苏+急救科普', src: 'B站搜索' },
    { title: '海姆立克急救法教学', url: 'https://search.bilibili.com/all?keyword=海姆立克急救法+成人+婴儿', src: 'B站搜索' },
    { title: '创伤止血包扎固定教学', url: 'https://search.bilibili.com/all?keyword=创伤急救+止血+包扎+固定', src: 'B站搜索' },
    { title: 'AHA心肺复苏指南解读', url: 'https://search.bilibili.com/all?keyword=AHA+心肺复苏指南+Hands+Only+CPR', src: 'B站搜索' }
  ];
  const html = '<div style="display:flex;flex-direction:column;gap:8px;">' +
    videos.map(v => '<a href="' + v.url + '" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8fafc;border-radius:10px;text-decoration:none;color:var(--c-text);font-size:0.85rem;font-weight:600;border:1px solid #e2e8f0;"><span style="font-size:1.2rem;">🔍</span><span>' + v.title + '</span><span style="margin-left:auto;font-size:0.7rem;color:var(--c-text-light);">' + v.src + '</span></a>').join('') +
    '</div><p style="font-size:0.7rem;color:var(--c-text-light);margin-top:8px;text-align:center;">点击将在B站搜索对应教学视频<br><span style="color:var(--c-text-muted);font-size:0.65rem;">搜索结果中可选择官方账号或高播放量视频观看</span></p>';
  showModal({ type: 'info', title: '📺 推荐急救教学视频', text: html, confirmText: '关闭' });
}

// ── 方案一：科学依据弹窗 ──
window.showSciencePanel = function() {
  var html = '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
    '<button class="science-tab active" onclick="switchScienceTab(\'heart\',this)" style="flex:1;padding:8px;border-radius:10px;border:2px solid #e53935;background:#fff1f0;color:#e53935;font-weight:700;font-size:0.75rem;cursor:pointer;font-family:var(--font);">🫀 心脏骤停</button>' +
    '<button class="science-tab" onclick="switchScienceTab(\'brain\',this)" style="flex:1;padding:8px;border-radius:10px;border:2px solid #E2E8F0;background:#fff;color:#64748b;font-weight:700;font-size:0.75rem;cursor:pointer;font-family:var(--font);">🧠 黄金4分钟</button>' +
    '<button class="science-tab" onclick="switchScienceTab(\'data\',this)" style="flex:1;padding:8px;border-radius:10px;border:2px solid #E2E8F0;background:#fff;color:#64748b;font-weight:700;font-size:0.75rem;cursor:pointer;font-family:var(--font);">📊 关键数据</button>' +
    '</div>' +
    '<div id="scienceContent"></div>' +
    '<p style="font-size:0.65rem;color:var(--c-text-light);margin-top:8px;">来源：《2020 AHA心肺复苏指南》《中国心肺复苏专家共识》</p>';

  showModal({ type: 'info', title: '📚 急救科学依据', text: html, confirmText: '关闭' });

  // Init first tab
  setTimeout(function() { switchScienceTab('heart'); }, 50);
}

window.switchScienceTab = function(tab, btn) {
  var contents = {
    heart: '<div style="font-size:0.8rem;line-height:1.7;color:var(--c-text-secondary);">' +
      '<p style="font-weight:700;color:var(--c-text);margin-bottom:6px;">心室颤动（VF）——最常见可电击心脏骤停心律</p>' +
      '<p>心脏骤停时，<b>心室颤动</b>是最常见的可电击心律（约占院外心脏骤停的25%-40%）。此时心肌细胞失去协调，各自紊乱颤动，心脏无法有效泵血，<b>及早除颤至关重要</b>。</p>' +
      '<p style="margin-top:8px;"><b>胸外按压的作用：</b>通过挤压心脏和胸腔建立人工循环，将含氧血液输送到大脑和重要器官。正确按压可维持正常心输出量的<b>30%以上</b>。</p>' +
      '<p style="margin-top:8px;"><b>AED除颤原理：</b>强直流电使所有心肌细胞同时除极化→度过不应期→窦房结重获主导→恢复窦性心律。就像电脑"强制重启"。</p>' +
      '</div>',
    brain: '<div style="font-size:0.8rem;line-height:1.7;color:var(--c-text-secondary);">' +
      '<p style="font-weight:700;color:var(--c-text);margin-bottom:6px;">大脑——对缺氧极度敏感的器官</p>' +
      '<p>大脑占全身耗氧量<b>20%</b>。心脏骤停后血液循环停止：</p>' +
      '<div style="background:#f8fafc;border-radius:8px;padding:10px;margin:8px 0;">' +
      '<p>⏱ <b>0-4分钟</b>：脑细胞<b style="color:#38A169;">可逆损伤阶段</b>（黄金抢救窗口）</p>' +
      '<p>⏱ <b>4-6分钟</b>：脑组织开始<b style="color:#F59E0B;">不可逆损伤</b></p>' +
      '<p>⏱ <b>6-10分钟</b>：广泛性脑损伤</p>' +
      '<p>⏱ <b>>10分钟</b>：脑死亡，基本丧失复苏可能</p>' +
      '</div>' +
      '<p style="color:var(--c-danger);font-weight:700;">每延迟1分钟开始CPR，生存率下降7%-10%。</p>' +
      '</div>',
    data: '<div style="font-size:0.8rem;line-height:1.7;color:var(--c-text-secondary);">' +
      '<p style="font-weight:700;color:var(--c-text);margin-bottom:6px;">中国心脏骤停急救现状</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0;">' +
      '<div style="background:var(--soft-red);border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:var(--c-danger);">54万</div><div style="font-size:0.65rem;">每年心脏骤停</div></div>' +
      '<div style="background:var(--soft-red);border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:var(--c-danger);"><10%</div><div style="font-size:0.65rem;">旁观者CPR比例</div></div>' +
      '<div style="background:var(--soft-red);border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:var(--c-danger);"><3%</div><div style="font-size:0.65rem;">院外生存率</div></div>' +
      '<div style="background:var(--soft-green);border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:var(--c-success);">2-3倍</div><div style="font-size:0.65rem;">目击者CPR提升</div></div>' +
      '</div>' +
      '<p style="margin-top:8px;"><b>按压参数：</b>深度5-6cm | 频率100-120次/分 | 中断<10秒 | 30:2按压通气比</p>' +
      '<p><b>AED除颤：</b>1分钟内除颤存活率约90% | 每晚1分钟下降7-10%</p>' +
      '</div>'
  };
  var el = document.getElementById('scienceContent');
  if (el) el.innerHTML = contents[tab] || contents.heart;

  // Highlight the correct tab
  var tabs = document.querySelectorAll('.science-tab');
  tabs.forEach(function(t) {
    t.style.border = '2px solid #E2E8F0';
    t.style.background = '#fff';
    t.style.color = '#64748b';
  });
  // Find and highlight target tab (default to first if btn not provided)
  if (!btn) {
    var tabMap = {heart:0, brain:1, data:2};
    btn = tabs[tabMap[tab] || 0];
  }
  if (btn) {
    btn.style.border = '2px solid #e53935';
    btn.style.background = '#fff1f0';
    btn.style.color = '#e53935';
  }
};

// ── 方案二：知识库快览弹窗 ──
window.showKnowledgePreview = function() {
  var items = [
    {icon:'🫀',title:'高质量CPR标准',desc:'按压深度5-6cm，频率100-120次/分，保证完全回弹'},
    {icon:'⚡',title:'AED详细步骤',desc:'开机→贴片→分析→电击，电击后立即恢复CPR'},
    {icon:'🫁',title:'气道梗阻急救',desc:'海姆立克法：剪刀石头布→向内上冲击'},
    {icon:'🩹',title:'创伤急救基础',desc:'DRABC评估法→直接压迫止血→包扎固定'},
    {icon:'🛡️',title:'好人法',desc:'民法典第184条：自愿施救造成损害不担责'},
    {icon:'⚠️',title:'常见误区',desc:'手肘弯曲、吹气过量、回弹不充分、中断过长'}
  ];
  var html = '<div style="display:flex;flex-direction:column;gap:6px;">';
  items.forEach(function(item) {
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">' +
      '<span style="font-size:1.5rem;width:36px;text-align:center;">' + item.icon + '</span>' +
      '<div style="flex:1;min-width:0;"><div style="font-size:0.8rem;font-weight:700;color:var(--c-text);">' + item.title + '</div><div style="font-size:0.68rem;color:var(--c-text-secondary);">' + item.desc + '</div></div>' +
      '</div>';
  });
  html += '</div>';
  html += '<button class="btn btn--primary btn--block btn--sm" onclick="document.getElementById(\'modal-overlay\').classList.remove(\'active\');window._goTo(12);" style="margin-top:10px;">📖 查看完整知识库 →</button>';
  showModal({ type: 'info', title: '📖 急救知识速览', text: html, confirmText: '关闭' });
}

// ── 排序题：急救时间线 ──
window._sortCorrect = ['环境评估','拨打120','判断呼吸','胸外按压','人工呼吸','AED除颤'];

function showSortingQuiz() {
  var cards = window._sortCorrect.slice().sort(function() { return Math.random() - 0.5; });
  window._sortUserOrder = new Array(6).fill(null);

  var html = '<p style="font-size:0.8rem;margin-bottom:10px;">🧩 拖动下方卡片到时间线槽位中</p>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;" id="sortSlots">';
  for (var i = 0; i < 6; i++) {
    html += '<div class="sort-slot" id="sortSlot'+i+'" data-slot="'+i+'" style="flex:1;min-width:44px;height:50px;border:2px dashed #CBD5E0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;color:#94A3B8;background:#f8fafc;">'+(i+1)+'</div>';
  }
  html += '</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;" id="sortCards">';
  cards.forEach(function(c, idx) {
    html += '<div class="sort-card" id="sortCard'+idx+'" data-label="'+c+'" data-idx="'+idx+'" style="padding:8px 12px;background:#fff;border:2px solid #E2E8F0;border-radius:10px;cursor:grab;font-size:0.72rem;font-weight:700;color:var(--c-text);box-shadow:0 2px 8px rgba(0,0,0,0.04);">'+c+'</div>';
  });
  html += '</div>';
  html += '<button class="btn btn--primary btn--block btn--sm" id="sortSubmitBtn" style="margin-top:12px;">提交验证 →</button>';
  html += '<div id="sortFeedback" style="margin-top:8px;font-size:0.78rem;text-align:center;"></div>';

  showModal({ type: 'info', title: '🧩 急救流程排序', text: html, confirmText: '' });
  setTimeout(function() {
    var modalBtns = $('#modalBtns');
    if (modalBtns) modalBtns.style.display = 'none';
    // Attach drag listeners after DOM render
    initSortDrag();
  }, 100);
}

function initSortDrag() {
  var cards = document.querySelectorAll('.sort-card');
  var slots = document.querySelectorAll('.sort-slot');

  cards.forEach(function(card) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('click', function() { window._sortPicked = {label:card.dataset.label,idx:card.dataset.idx}; var ac=document.querySelectorAll('.sort-card'); ac.forEach(function(c){c.style.borderColor='#E2E8F0'}); card.style.borderColor='#3b82f6'; });
    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', card.dataset.label + '|||' + card.dataset.idx);
      card.style.opacity = '0.5';
    });
    card.addEventListener('dragend', function(e) {
      card.style.opacity = '';
    });
  });

  slots.forEach(function(slot) {
    slot.addEventListener('click', function() { if(!window._sortPicked){ var filled=slot.dataset.filled; if(filled){ var si=parseInt(slot.dataset.slot); window._sortUserOrder[si]=null; slot.textContent=si+1; slot.style.borderColor='#CBD5E0'; slot.style.background='#f8fafc'; slot.dataset.filled=''; var ac2=document.querySelectorAll('.sort-card'); ac2.forEach(function(c){if(c.dataset.label===filled)c.style.display=''}); } return; } var p=window._sortPicked; window._sortPicked=null; var l=p.label,i=parseInt(p.idx); var si=parseInt(slot.dataset.slot); for(var j=0;j<6;j++){if(window._sortUserOrder[j]===l){window._sortUserOrder[j]=null;var os2=document.getElementById('sortSlot'+j);if(os2){os2.textContent=j+1;os2.style.borderColor='#CBD5E0';os2.style.background='#f8fafc';os2.dataset.filled='';}}} var ol2=slot.dataset.filled;if(ol2){var ac2=document.querySelectorAll('.sort-card');ac2.forEach(function(c){if(c.dataset.label===ol2)c.style.display=''});} window._sortUserOrder[si]=l;slot.textContent=l;slot.style.borderColor='#3b82f6';slot.style.background='#eff6ff';slot.dataset.filled=l;var c2=document.getElementById('sortCard'+i);if(c2)c2.style.display='none'; });
    slot.addEventListener('dragover', function(e) {
      e.preventDefault();
      slot.style.borderColor = '#3b82f6';
    });
    slot.addEventListener('dragleave', function(e) {
      slot.style.borderColor = '#CBD5E0';
    });
    slot.addEventListener('drop', function(e) {
      e.preventDefault();
      slot.style.borderColor = '#CBD5E0';
      var raw = e.dataTransfer.getData('text/plain');
      var parts = raw.split('|||');
      var label = parts[0], idx = parseInt(parts[1]);
      var slotIdx = parseInt(slot.dataset.slot);
      // Remove from previous slot and restore card
      for (var i = 0; i < 6; i++) {
        if (window._sortUserOrder[i] === label) {
          window._sortUserOrder[i] = null;
          var oldSlot = document.getElementById('sortSlot'+i);
          if (oldSlot) { oldSlot.textContent = i+1; oldSlot.style.borderColor = '#CBD5E0'; oldSlot.style.background = '#f8fafc'; oldSlot.dataset.filled = ''; }
        }
      }
      // 如果槽位已有卡片，先还原旧卡片
      var oldLabel = slot.dataset.filled;
      if (oldLabel) {
        var oldCards = document.querySelectorAll('.sort-card');
        oldCards.forEach(function(c) { if (c.dataset.label === oldLabel) c.style.display = ''; });
      }
      window._sortUserOrder[slotIdx] = label;
      slot.textContent = label;
      slot.style.borderColor = '#3b82f6';
      slot.style.background = '#eff6ff';
      slot.dataset.filled = label;
      // 隐藏卡片池中的卡片
      var card = document.getElementById('sortCard'+idx);
      if (card) card.style.display = 'none';
    });
  });

  // ── Touch drag for mobile (direct drag, no long-press) ──
  var _touchCard = null, _touchClone = null;
  cards.forEach(function(card) {
    card.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      var t = e.touches[0];
      _touchCard = card;
      _touchClone = card.cloneNode(true);
      _touchClone.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;opacity:0.92;transform:scale(1.06) rotate(1.5deg);box-shadow:0 10px 32px rgba(0,0,0,0.22);padding:8px 12px;background:#fff;border:2px solid #3b82f6;border-radius:10px;font-size:0.72rem;font-weight:700;color:var(--c-text);';
      _touchClone.style.left = (t.clientX - card.offsetWidth/2) + 'px';
      _touchClone.style.top = (t.clientY - card.offsetHeight/2) + 'px';
      document.body.appendChild(_touchClone);
      card.style.opacity = '0.3';
    }, {passive: false});
  });
  document.addEventListener('touchmove', window._sortTouchMove = function(e) {
    if (!_touchCard || !_touchClone) return;
    e.preventDefault();
    var t = e.touches[0];
    _touchClone.style.left = (t.clientX - _touchClone.offsetWidth/2) + 'px';
    _touchClone.style.top = (t.clientY - _touchClone.offsetHeight/2) + 'px';
    // Batch read all rects first, then write — avoids layout thrashing
    var slotRects = [];
    for (var si = 0; si < slots.length; si++) {
      slotRects.push(slots[si].getBoundingClientRect());
    }
    for (var sj = 0; sj < slots.length; sj++) {
      var r = slotRects[sj];
      var over = t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
      slots[sj].style.borderColor = over ? '#3b82f6' : '#CBD5E0';
      slots[sj].style.background = over ? '#eff6ff' : '#f8fafc';
    }
  }, {passive: false});
  document.addEventListener('touchcancel', window._sortTouchCancel = function(e) {
    if (!_touchCard) return;
    if (_touchClone) { _touchClone.remove(); _touchClone = null; }
    if (_touchCard) { _touchCard.style.opacity = ''; _touchCard = null; }
    for (var sj = 0; sj < slots.length; sj++) {
      slots[sj].style.borderColor = '#CBD5E0';
      slots[sj].style.background = '#f8fafc';
    }
  }, {passive: false});

  document.addEventListener('touchend', window._sortTouchEnd = function(e) {
    if (!_touchCard) return;
    var t = e.changedTouches[0];
    var hitSlot = null;
    // Batch read, then write
    var endRects = [];
    for (var ei = 0; ei < slots.length; ei++) {
      endRects.push(slots[ei].getBoundingClientRect());
    }
    for (var ej = 0; ej < slots.length; ej++) {
      var r = endRects[ej];
      if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
        hitSlot = slots[ej];
      }
      slots[ej].style.borderColor = '#CBD5E0';
      slots[ej].style.background = '#f8fafc';
    }
    if (hitSlot) {
      var label = _touchCard.dataset.label, idx = parseInt(_touchCard.dataset.idx), si = parseInt(hitSlot.dataset.slot);
      for (var i = 0; i < 6; i++) {
        if (window._sortUserOrder[i] === label) {
          window._sortUserOrder[i] = null;
          var os = document.getElementById('sortSlot'+i);
          if (os) { os.textContent = i+1; os.style.borderColor = '#CBD5E0'; os.style.background = '#f8fafc'; os.dataset.filled = ''; }
        }
      }
      var oldL = hitSlot.dataset.filled;
      if (oldL) {
        document.querySelectorAll('.sort-card').forEach(function(c) { if (c.dataset.label === oldL) c.style.display = ''; });
      }
      window._sortUserOrder[si] = label;
      hitSlot.textContent = label;
      hitSlot.style.borderColor = '#3b82f6';
      hitSlot.style.background = '#eff6ff';
      hitSlot.dataset.filled = label;
      _touchCard.style.display = 'none';
    }
    if (_touchClone) { _touchClone.remove(); _touchClone = null; }
    if (_touchCard) { _touchCard.style.opacity = ''; _touchCard = null; }
  }, {passive: false});

  $('#sortSubmitBtn').onclick = function() {
    var fb = document.getElementById('sortFeedback');
    var allFilled = window._sortUserOrder.every(function(v) { return v !== null; });
    if (!allFilled) { if (fb) fb.innerHTML = '<span style="color:#dc2626;">请填满所有时间线位置</span>'; return; }
    var correct = window._sortUserOrder.every(function(v, i) { return v === window._sortCorrect[i]; });
    if (correct) {
      if (fb) fb.innerHTML = '<span style="color:#16a34a;">✅ 排序正确！急救流程已掌握！</span>';
      state.scores.cycle = 10; state.completed[9] = true; Timer.stop();
      setTimeout(function() {
        document.getElementById('modal-overlay').classList.remove('active');
        showToast('🎉 急救流程已掌握！', 'success');
        goToPage(10);
      }, 1000);
    } else {
      if (fb) fb.innerHTML = '<span style="color:#dc2626;">❌ 顺序不对。正确顺序：<br>'+window._sortCorrect.join(' → ')+'</span>';
      setTimeout(function() {
        document.getElementById('modal-overlay').classList.remove('active');
        showToast('记一下正确顺序，重新练习', 'info');
        state.sortRetry = true;
        continueToNextRound();
      }, 2500);
    }
  };
}

// _sortSubmit moved into initSortDrag for reliable event binding

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `feedback-toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ==========================================================
// 8. AI Helper
// ==========================================================
const aiTips = {
  3: '环境安全是第一原则！必须先确保自身安全才能施救。',
  4: '拨打120要说清楚：地点、症状、患者状态。AED越早使用越好。',
  5: '判断呼吸看胸廓起伏，非专业人员可以不触摸脉搏。20秒内完成。',
  6: '按压位置：两乳头连线中点。深度5-6cm，频率100-120次/分。每次让胸廓完全回弹。',
  7: '吹气看到胸廓隆起即可，过度吹气会导致胃胀气。按压-通气比30:2。',
  8: 'AED负责"重启"心脏，CPR负责维持供血。两者必须配合使用。',
  9: '每2分钟建议轮换按压者，避免疲劳导致按压质量下降。',
};
function toggleAiBubble() {
  const bubble = $('#aiBubble');
  if (bubble.classList.contains('show')) {
    bubble.classList.remove('show');
  } else {
    const tip = aiTips[state.currentPage] || '完成训练后可以在知识库中查看更多急救知识。';
    bubble.textContent = tip;
    bubble.classList.add('show');
    setTimeout(() => bubble.classList.remove('show'), 5000);
  }
}

// ==========================================================
// 9. Step Indicator
// ==========================================================
function buildStepIndicator() {
  const container = $('#step-indicator');
  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const dot = document.createElement('span');
    dot.className = 'step-dot'; dot.textContent = i;
    dot.dataset.step = i;
    if (i === 1) dot.classList.add('active');
    container.appendChild(dot);
    // Add connector line between dots (not after last)
    if (i < 10) {
      const line = document.createElement('span');
      line.className = 'step-line'; line.dataset.line = i;
      container.appendChild(line);
    }
  }
}

function updateStepIndicator(currentStep) {
  const dots = $$('.step-dot');
  dots.forEach(d => {
    const s = parseInt(d.dataset.step);
    d.classList.remove('done', 'active');
    if (s < currentStep) { d.classList.add('done'); d.textContent = '✓'; }
    else if (s === currentStep) { d.classList.add('active'); d.textContent = s; }
    else { d.textContent = s; }
  });
  const lines = $$('.step-line');
  lines.forEach(l => {
    const ls = parseInt(l.dataset.line);
    l.classList.toggle('done', ls < currentStep);
  });
}

// ==========================================================
// 10. Router / Page Switcher
// ==========================================================
function canAccessPage(target) {
  // 首页始终可访问
  if (target === 1) return true;
  // 专项入口可随时进入
  if (target === 26 || target === 34 || target === 43) return true;
  // 旧版页面禁止
  if (target >= 13 && target <= 25) return false;
  // CPR主流程 2-12：只能进入已完成页、当前页或下一页
  if (target >= 2 && target <= 12) {
    var mainPos = state.mainPosition || 1;
    // 只能回退、停留在当前页、或前进一页
    if (target <= mainPos) return true;
    if (target === mainPos + 1) return true;
    return false;
  }
  // 专项内部按序推进
  if (target >= 27 && target <= 33) {
    if (state.currentPage >= 26 && state.currentPage <= 33) return target <= state.currentPage + 1;
    return target === 27;
  }
  if (target >= 35 && target <= 42) {
    if (state.currentPage >= 34 && state.currentPage <= 42) return target <= state.currentPage + 1;
    return target === 35;
  }
  if (target >= 44 && target <= 50) {
    if (state.currentPage >= 43 && state.currentPage <= 50) return target <= state.currentPage + 1;
    return target === 44;
  }
  return false;
}

function goToPage(targetPage, opts = {}) {
  const current = state.currentPage;
  if (!opts.force && !canAccessPage(targetPage)) {
    showModal({ type: 'warning', title: '请按顺序操作', text: '请先完成当前步骤再继续。' });
    return;
  }

  // Leave hook
  onPageLeave(current);
  // Simple display-based page switch
  const oldEl = $(`.page[data-page="${current}"]`);
  const newEl = $(`.page[data-page="${targetPage}"]`);
  if (oldEl) oldEl.classList.remove('active');
  if (newEl) { newEl.classList.add('active'); newEl.scrollTop = 0; }

  state.pageHistory.push(current);
  state.currentPage = targetPage;
  if (targetPage >= 1 && targetPage <= 12) state.mainPosition = targetPage;

  // Enter hook
  onPageEnter(targetPage, opts);
  // Update chrome
  updateGlobalHeader(targetPage);
  updateStepIndicator(mapPageToStep(targetPage));
  // Push history
  try { window.history.pushState({ page: targetPage }, '', `#page${targetPage}`); } catch(e) {}
}

function mapPageToStep(p) {
  // 12 步训练闭环：P1→首页 P2→情景 P3→环境 P4→呼救 P5→判断 P6→按压
  // P7→通气 P8→AED P9→循环 P10→结局 P11→报告 P12→知识库
  const map = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:12 };
  return map[p] || p;
}

function updateGlobalHeader(page) {
  const header = $('#global-header');
  const footer = $('#global-footer');
  if (page >= 2 && page <= 12) {
    header.classList.remove('hidden');
    if (page <= 10) footer.classList.remove('hidden');
    else footer.classList.add('hidden');
    const step = mapPageToStep(page);
    $('#headerStep').textContent = '第 ' + step + '/12 步';
    if (page >= 11) $('#globalTimer').textContent = formatTime(state.totalTime);
  } else {
    header.classList.add('hidden');
    footer.classList.add('hidden');
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60); const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ==========================================================
// 11. Page Lifecycle Hooks
// ==========================================================
function onPageLeave(p) {
  // Cancel any ongoing speech synthesis
  if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
  switch(p) {
    case 1:
      if (splashEcgRaf) { cancelAnimationFrame(splashEcgRaf); splashEcgRaf = null; }
      $('#splashEcgBg').style.display = 'none';
      $('.hero-cross-pulsate').style.animation = 'none';
      $('.hero-ring-glow').style.animation = 'none';
      $('.hero-ring-glow-2').style.animation = 'none';
      break;
    case 4: endCallConversation(); break;
    case 5: if (bcTimerInterval) { clearInterval(bcTimerInterval); bcTimerInterval = null; } if (bcObserveInterval) { clearInterval(bcObserveInterval); bcObserveInterval = null; } break;
    case 6: stopCompression(); break;
    case 7: stopBreathing(); break;
    case 8:
      // Clean up AED drag listeners
      var pads = $$('.aed-drag-pad');
      if (pads && pads._dragCleanup) { pads._dragCleanup(); pads._dragCleanup = null; }
      break;
  }
}

function onPageEnter(p, opts = {}) {
  switch(p) {
    case 1: enterPage1(); break;
    case 2: enterPage2(); break;
    case 3: enterPage3(); break;
    case 4: enterPage4(); break;
    case 5: enterPage5(); break;
    case 6: enterPage6(); break;
    case 7: enterPage7(); break;
    case 8: enterPage8(); break;
    case 9: enterPage9(); break;
    case 10: enterPage10(opts); break;
    case 11: enterPage11(); break;
    case 12: enterPage12(); break;
    // 专项训练入口 — 点击侧栏或首页卡片时初始化
    case 26: if (typeof window._startAed === 'function') window._startAed(); break;
    case 34: if (typeof window._startChoke === 'function') window._startChoke(); break;
    case 43: if (typeof window._startTrauma === 'function') window._startTrauma(); break;
  }
}

// ==========================================================
// PAGE 1: 首页
// ==========================================================
function enterPage1() {
  state.completed = {};
  state.mainPosition = 1;
  const best = Storage.getBestScore();
  $('#bestScoreDisplay').innerHTML = best > 0 ? `历史最佳：<strong>${best}</strong> 分` : '历史最佳：<strong>--</strong> 分';
  $('#splashEcgBg').style.display = '';
  $('.hero-cross-pulsate').style.animation = 'heartbeatPulse 1.2s ease-in-out infinite';
  $('.hero-ring-glow').style.animation = 'rotateRing 12s linear infinite';
  $('.hero-ring-glow-2').style.animation = 'rotateRing 18s linear infinite reverse';
  startSplashEcg();
}

// Splash ECG animation
let splashEcgOff = 0, splashEcgRaf;
function startSplashEcg() {
  const canvas = $('#splashEcgBg');
  if (!canvas) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.min(window.innerWidth, 800) * dpr;
  canvas.height = Math.min(window.innerHeight, 600) * dpr;
  canvas.style.width = Math.min(window.innerWidth, 800) + "px";
  canvas.style.height = Math.min(window.innerHeight, 600) + "px";
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Glow effect
    ctx.shadowColor = 'rgba(229,57,53,0.2)'; ctx.shadowBlur = 4;
    ctx.strokeStyle = 'rgba(229,57,53,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const midY = canvas.height / 2;
    for (let x = 0; x < canvas.width; x++) {
      const period = 120;
      const phase = ((x + splashEcgOff) % period) / period;
      let y = 0;
      if (phase > 0.45 && phase < 0.55) y = -30 * Math.exp(-Math.pow((phase - 0.5) * 30, 2));
      else if (phase > 0.05 && phase < 0.15) y = -8 * Math.sin((phase - 0.05) / 0.1 * Math.PI);
      else if (phase > 0.6 && phase < 0.8) y = -12 * Math.sin((phase - 0.6) / 0.2 * Math.PI);
      if (x === 0) ctx.moveTo(x, midY + y);
      else ctx.lineTo(x, midY + y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    splashEcgOff += 1.5;
    splashEcgRaf = requestAnimationFrame(draw);
  }
  draw();
}

// ==========================================================
// PAGE 2: 情景引入
// ==========================================================
function enterPage2() {
  const scenes = ['park', 'bathroom', 'subway', 'home'];
  state.sceneType = scenes[Math.floor(Math.random() * scenes.length)];
  const art = $('#sceneArt');
  const dangerStrip = $('#dangerStrip');

  window._sceneImages = { park: 'data:image/webp;base64,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', court: '', bathroom: 'data:image/webp;base64,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', subway: 'data:image/webp;base64,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', home: 'data:image/webp;base64,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' };
  var imgSrc = window._sceneImages[state.sceneType] || '';
  const config = {
    park: { name: '公园', story: '你在<span class="highlight">公园</span>散步时，发现一位老人突然倒在长椅旁。<br><br>周围路人惊慌失措，有人喊"快打120！"。<br><br><span class="highlight">时间就是生命！</span>你决定上前施救。', danger: '', deco: '' },
    court: { name: '球场', story: '你在<span class="highlight">篮球场</span>上，一位球友突然倒下，没有反应。<br><br>球友们围了过来，有人在做心肺复苏的按压手势。<br><br><span class="highlight">抓紧时间！</span>你立即开始急救。', danger: '', deco: '' },
    bathroom: { name: '浴室', story: '你在家中听到<span class="highlight">浴室</span>传来一声闷响。<br><br>冲进去发现家人倒在潮湿的地面上，疑似触电。<br><br><span class="highlight">先断电源！确保自身安全！</span>', danger: '🚨 现场高危风险阻断提示：积水 + 漏电高压', deco: '' },
    subway: { name: '地铁站', story: '你在<span class="highlight">地铁站台</span>等车时，一位通勤者突然倒地。<br><br>站台上人群骚动，广播响起"请工作人员速到B2层"。<br><br><span class="highlight">地铁站一般配有AED！</span>请立即行动。', danger: '', deco: '' },
    home: { name: '家中', story: '深夜，你听到隔壁房间传来<span class="highlight">重物倒地</span>的声音。<br><br>冲过去发现家中老人倒在地上，怎么叫都没有反应。<br><br><span class="highlight">别慌！立即拨打120并开始CPR！</span>', danger: '', deco: '' }
  };
  const c = config[state.sceneType] || config.park;

  // Set scene photo via <img> tag — 零覆盖物
  var photo = $('#scenePhoto');
  if (imgSrc && photo) {
    photo.src = imgSrc;
    photo.style.display = 'block';
    art.style.background = '#e8edf2';
  } else if (photo) {
    photo.style.display = 'none';
    art.style.background = 'linear-gradient(180deg, #87CEEB, #B0BEC5 40%, #90A4AE) no-repeat';
  }
  $('#sceneNarrative').innerHTML = c.story;

  // Danger strip — only for bathroom
  if (c.danger) {
    dangerStrip.textContent = c.danger;
    dangerStrip.style.display = 'flex';
  } else {
    dangerStrip.style.display = 'none';
  }

  // Save attempt
  Storage.incrementAttempts();
  state.totalAttempts = Storage.getTotalAttempts();

  // Scene name badge
  const existing = art.querySelector('.scene-badge');
  if (existing) existing.remove();
  const badge = document.createElement('div');
  badge.className = 'scene-badge';
  badge.style.cssText = 'position:absolute;top:12px;left:16px;background:rgba(0,0,0,0.5);color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;z-index:5;';
  badge.textContent = '📍 ' + c.name;
  art.appendChild(badge);
}

// ==========================================================
// PAGE 3: 环境评估
// ==========================================================
let envAnswered = false;
function enterPage3() {
  state.completed[2] = true;
  if (!state.timerRunning) Timer.start();
  envAnswered = false;
  const isElec = state.sceneType === 'bathroom';
  const sceneNames = { park: '公园', court: '篮球场', bathroom: '浴室', subway: '地铁站', home: '家中' };

  // Set scene illustration photo via <img> tag
  var envImg = (window._sceneImages && window._sceneImages[state.sceneType]) || '';
  var envPhoto = $('#envPhoto');
  if (envImg && envPhoto) {
    envPhoto.src = envImg;
    envPhoto.style.display = 'block';
  } else if (envPhoto) {
    envPhoto.style.display = 'none';
    // fallback gradient on parent
    $('#envScene').style.background = 'linear-gradient(180deg, #87CEEB, #B0BEC5 40%, #90A4AE)';
  }
  $('#envScene').style.background = envImg ? '' : 'linear-gradient(180deg, #87CEEB, #B0BEC5 40%, #90A4AE)';

  // Set immersive context
  const contexts = {
    park: '你正在公园散步，前方一位老人倒在长椅旁，周围有几位路人。',
    court: '篮球场上，一位球友突然倒地。球友们都围了过来，有人很慌张。',
    bathroom: '浴室里家人倒在地上，地面有水渍，墙上电热水器还亮着灯。',
    subway: '地铁站台上，一位通勤者突然倒地。人群骚动，广播正在呼叫工作人员。',
    home: '深夜家中，老人突然倒地。房间里只有你一个人，需要立即行动。'
  };
  $('#envSceneIcon').textContent = isElec ? '⚡' : '🚨';
  $('#envContextText').textContent = contexts[state.sceneType] || contexts.park;

  $('#envQuestion').textContent = '急救第一步，你应该怎么做？';
  var html = '';
  if (isElec) {
    html += '<button class="quiz-option" data-choice="A">🏃 A. 立刻冲进去把家人拖出来</button>';
    html += '<button class="quiz-option" data-choice="B">🔌 B. 先切断电源总闸，确保安全后再进入施救</button>';
    html += '<button class="quiz-option" data-choice="C">📞 C. 先拨打120，等待救援不自行进入</button>';
    html += '<button class="quiz-option" data-choice="D">🗣️ D. 大声呼喊家人名字，看是否有反应</button>';
  } else {
    var opts = [
      {label:'🏃 A. 直接冲过去开始按压', choice:'A'},
      {label:'🔍 B. 先观察环境是否安全，再轻拍双肩呼喊判断意识', choice:'B'},
      {label:'💊 C. 翻找患者口袋看是否有急救药品', choice:'C'},
      {label:'📞 D. 只打电话等救护车，不做其他操作', choice:'D'}
    ]; shuffle(opts);
    var html = opts.map(function(o){return '<button class="quiz-option" data-choice="'+o.choice+'">'+o.label+'</button>';}).join('');
  }
  // Reset riskEvents for this page
  state.riskEvents = state.riskEvents || [];
  // Clear risk replay card
  try { var rr = $('#riskReplayP3'); if (rr) rr.classList.remove('show'); } catch(e) {}

  $('#envOptions').innerHTML = html;
  $('#envFeedback').className = 'quiz-feedback'; $('#envFeedback').style.display = 'none';
  $('#envNextBtn').style.display = 'none';
  try { $('#kcP3').classList.remove('show'); } catch(e) {}

  $('#envOptions').onclick = (e) => {
    if (envAnswered) return;
    const btn = e.target.closest('.quiz-option');
    if (!btn) return;
    envAnswered = true;
    const correct = isElec ? 'B' : 'B'; // B is always correct for both scenarios

    if (btn.dataset.choice === correct) {
      btn.classList.add('correct');
      state.scores.env = 5;
      $('#envFeedback').className = 'quiz-feedback success show';
      if (isElec) {
        $('#envFeedback').textContent = '✅ 非常正确！触电现场必须先切断电源。进入潮湿带电环境会让自己也触电，造成二次伤害。施救者的安全永远是第一位！';
      } else {
        $('#envFeedback').textContent = '✅ 完全正确！环境安全是急救第一原则。先观察周围有无危险（车辆、电线、火源等），确保安全后再接近患者检查意识。';
      }
      Audio.ding(); showToast('+5 分', 'success');
    } else {
      btn.classList.add('wrong');
      state.scores.env = Math.max(0, state.scores.env - 5);
      $('#envFeedback').className = 'quiz-feedback error show';
      if (btn.dataset.choice === 'A') {
        $('#envFeedback').textContent = '❌ 太冒险了！' + (isElec ? '直接进入带电区域会让你也触电。' : '直接冲过去可能忽略了周围危险（如车辆）。') + ' 必须优先确保自身安全。请重新选择。';
        showRiskReplay(3, {type:'safety', action:(isElec?'直接冲进带电浴室拖人':'未观察环境直接冲过去开始按压'), risk:'施救者触电/受伤成为第二受害者', correct:(isElec?'先切断总电源再用干燥绝缘物挑开电线后进入':'先观察环境排除危险，确认安全后再接近患者'), knowledge:'safety', tip:'急救第一原则：确保自身安全后才能施救'});
      } else if (btn.dataset.choice === 'C') {
        $('#envFeedback').textContent = '❌ 找药不是急救第一步！急救的核心流程是：确认安全→判断反应→呼救→CPR→AED。请重新选择。';
        pushRisk({type:'safety', action:'先翻找药品而非评估环境', risk:'延误急救启动', correct:'先确保环境安全再评估患者', knowledge:'safety', tip:'急救链第一步是确认现场安全'});
      } else if (btn.dataset.choice === 'D') {
        $('#envFeedback').textContent = isElec ? '❌ 等待救援时家人可能持续触电！必须先断电再施救。请重新选择。' : '❌ 只等待不施救会错失宝贵的急救时机！但先确保安全是正确的思路。请选择最完整的答案。';
      }
      Audio.buzzer();
      envAnswered = false;
      setTimeout(() => { btn.classList.remove('wrong'); }, 1200);
      return;
    }
    // Disable all options and highlight correct
    $$('#envOptions .quiz-option').forEach(b => { b.style.pointerEvents = 'none'; });
    $$('#envOptions .quiz-option').forEach(b => { if (b.dataset.choice === correct) b.classList.add('correct'); });
    $('#envNextBtn').style.display = 'block';
    $('#envNextBtn').onclick = () => { $('#kcP3').classList.add('show'); $('#envNextBtn').style.display = 'none'; };
  };
}

// ==========================================================
// PAGE 4: 呼救与AED
// ==========================================================
let aedTimerInterval = null;
function enterPage4() {
  try { $('#aedWaitCard').style.display = 'none'; } catch(e) {}
  try { $('#aedArrived').style.display = 'none'; } catch(e) {}
  try { $('#callFeedback').className = 'quiz-feedback'; $('#callFeedback').style.display = 'none'; } catch(e) {}
  state.aedWaitRemaining = 8;
  try { $('#aedTimer').textContent = '8'; } catch(e) {}
  if (aedTimerInterval) { clearInterval(aedTimerInterval); aedTimerInterval = null; }
  if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
  startCallConversation();
}

// ── Voice profiles ──
var voiceProfiles = {
  dispatcher: { rate: 1.3, pitch: 1.15, vol: 1.0 },
  aed:        { rate: 1.3, pitch: 1.0, vol: 1.0 },
  guide:      { rate: 1.3, pitch: 1.1, vol: 0.9 },
  urgent:     { rate: 1.5, pitch: 1.3, vol: 1.0 }
};

// ── New speak: profile + cancel previous ──
function speak(text, profile) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  var p = voiceProfiles[profile] || voiceProfiles.guide;
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = p.rate; u.pitch = p.pitch; u.volume = p.vol;
  window.speechSynthesis.speak(u);
}

// ── Sequential speech: pauses between sentences ──
function speakSequence(arr, profile) {
  if (!arr || !arr.length) return;
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  var p = voiceProfiles[profile] || voiceProfiles.guide;
  function next(i) {
    if (i >= arr.length) return;
    var u = new SpeechSynthesisUtterance(arr[i]);
    u.lang = 'zh-CN'; u.rate = p.rate; u.pitch = p.pitch; u.volume = p.vol;
    u.onend = function() { setTimeout(function() { next(i + 1); }, 400); };
    window.speechSynthesis.speak(u);
  }
  next(0);
}

// Legacy wrapper
function trySpeak(text) { speak(text, 'guide'); }

// ==========================================================
/* P5 — Breath Check Trainer */
let bcTimerInterval = null, bcTimeLeft = 20, bcObserveInterval = null, _bcSkipped = false;

function enterPage5() {
  state.breathCheckTrainer = { tapShoulder: false, shout: false, observeStarted: false, observeDuration: 0, selectedResult: null, completed: false };
  bcTimeLeft = 20; _bcSkipped = false;
  if (bcTimerInterval) clearInterval(bcTimerInterval);
  if (bcObserveInterval) clearInterval(bcObserveInterval);
  try { $('#kcP5').classList.remove('show'); } catch(e) {}
  try { $('#riskReplayP5').classList.remove('show'); } catch(e) {}
  $('#bcTimer').textContent = '20'; $('#bcTimer').style.color = '';
  $('#bcTimerFill').style.transform = 'scaleX(1)';
  $('#bcShoutBubble').classList.remove('show');
  $('#bcObserveCountdown').style.display = 'none';
  $('#bcSkipObserve').style.display = 'none';
  $('#bcObserveTimer').textContent = '10'; $('#bcObserveTimer').style.color = '';
  $('#bcVerdict').style.display = 'none';
  // 重置胸廓动画
  var chest = document.getElementById('bcBodyChest');
  if (chest) { chest.classList.remove('breathing', 'not-breathing', 'twitch'); }
  $('#bcFeedback').innerHTML = '<p>👆 点击 <strong>"轻拍双肩"</strong> 开始检查患者反应</p>';
  ['bcStep1','bcStep2','bcStep3'].forEach(function(id) { var el=$('#'+id); if(el)el.classList.remove('done'); });
  ['bcStatus1','bcStatus2','bcStatus3'].forEach(function(id) { var el=$('#'+id); if(el){el.textContent='待操作';el.className='bc-step-status';} });

  bcTimerInterval = setInterval(function() {
    bcTimeLeft--;
    $('#bcTimer').textContent = bcTimeLeft;
    $('#bcTimerFill').style.transform = 'scaleX(' + (bcTimeLeft/20) + ')';
    if (bcTimeLeft <= 3) $('#bcTimer').style.color = '#ef4444';
    if (bcTimeLeft <= 0) {
      clearInterval(bcTimerInterval); bcTimerInterval = null;
      if (!state.breathCheckTrainer.completed) {
        $('#bcFeedback').innerHTML = '<p style="color:var(--c-danger);">⏰ 全局超时！判断应在20秒内完成。请继续完成剩余步骤。</p>';
        pushRisk({type:'breathing', action:'呼吸判断超时(>20秒)', risk:'延误胸外按压启动时机', correct:'20秒内完成呼吸判断', knowledge:'breathing', tip:'非专业人员只需看胸廓起伏，20秒内完成判断'});
        // 不强制显示判断按钮——必须完成三步后才显示
      }
    }
  }, 1000);

  // 在胸部区域生成拍击波纹
  function spawnTapRipple() {
    var torso = document.querySelector('.bc-body-torso');
    if (!torso) return;
    var ripple = document.createElement('div'); ripple.className = 'tap-ripple';
    ripple.style.left = '50%'; ripple.style.top = '30%';
    ripple.style.marginLeft = '-30px'; ripple.style.marginTop = '-30px';
    torso.appendChild(ripple);
    setTimeout(function(){ ripple.remove(); }, 500);
  }
  $('#bcStep1').onclick = function() {
    if (state.breathCheckTrainer.tapShoulder) return;
    state.breathCheckTrainer.tapShoulder = true;
    $('#bcStep1').classList.add('done'); $('#bcStatus1').textContent = '✓ 已完成'; $('#bcStatus1').className = 'bc-step-status done';
    try { $('#bcStep1').style.animation = 'visualShake 0.3s ease-out'; setTimeout(function(){ $('#bcStep1').style.animation = ''; }, 300); } catch(e) {}
    // 拍肩波纹 + 身体抖动
    spawnTapRipple();
    var chest = document.getElementById('bcBodyChest'); if (chest) { chest.classList.add('twitch'); setTimeout(function(){ chest.classList.remove('twitch'); }, 400); }
    Audio.play(300, 'square', 0.18, 0.12);
    $('#bcFeedback').innerHTML = '<p>🫱 你拍了拍患者双肩...<br><span style="color:var(--c-danger);">—— 患者没有任何反应。</span></p>';
    if (!state.breathCheckTrainer.shout) { var el=$('#bcStep2'); if(el)el.style.boxShadow='0 0 0 3px rgba(6,182,212,0.5)'; }
  };
  $('#bcStep2').onclick = function() {
    if (!state.breathCheckTrainer.tapShoulder) { showToast('请先轻拍双肩', 'info'); return; }
    if (state.breathCheckTrainer.shout) return;
    state.breathCheckTrainer.shout = true;
    $('#bcStep2').classList.add('done'); $('#bcStep2').style.boxShadow = '';
    $('#bcStatus2').textContent = '✓ 已完成'; $('#bcStatus2').className = 'bc-step-status done';
    // 呼喊气泡增强——语音波形动画
    var bubble = $('#bcShoutBubble');
    if (bubble) {
      bubble.querySelector('span').innerHTML = '🗣️ <span class="voice-wave">你</span><span class="voice-wave">还</span><span class="voice-wave">好</span><span class="voice-wave">吗</span><span class="voice-wave">？</span><span class="voice-wave">能</span><span class="voice-wave">听</span><span class="voice-wave">到</span><span class="voice-wave">我</span><span class="voice-wave">吗</span><span class="voice-wave">？</span>';
      bubble.classList.add('show');
    }
    Audio.play(500, 'square', 0.22, 0.18);
    // 3秒后清除气泡和波纹动画
    setTimeout(function() {
      if (bubble) { bubble.classList.remove('show'); bubble.querySelector('span').innerHTML = '🗣️ 你还好吗？能听到我吗？'; }
    }, 3000);
    $('#bcFeedback').innerHTML = '<p>📢 你大声呼喊...<br><span style="color:var(--c-danger);">—— 患者没有任何回应。需要立即行动！</span></p>';
    if (!state.breathCheckTrainer.observeStarted) { var el=$('#bcStep3'); if(el)el.style.boxShadow='0 0 0 3px rgba(59,130,246,0.5)'; }
  };
  $('#bcStep3').onclick = function() {
    if (!state.breathCheckTrainer.shout) { showToast('请先大声呼喊', 'info'); return; }
    if (state.breathCheckTrainer.observeStarted) return;
    state.breathCheckTrainer.observeStarted = true;
    $('#bcStep3').classList.add('done'); $('#bcStep3').style.boxShadow = '';
    $('#bcStatus3').textContent = '观察中...'; $('#bcStatus3').className = 'bc-step-status observing';
    $('#bcObserveCountdown').style.display = 'flex';
    // 启动胸廓呼吸动画——模拟正常呼吸后停止
    var chest = document.getElementById('bcBodyChest');
    if (chest) { chest.classList.add('breathing'); }
    $('#bcSkipObserve').style.display = 'none';
    $('#bcFeedback').innerHTML = '<p>👀 正在观察胸廓起伏，请专注...<br><span style="font-size:0.72rem;color:var(--c-text-muted);">注意：现实中观察不超过10秒</span></p>';
    var obsLeft = 10; $('#bcObserveTimer').textContent = obsLeft;
    var phaseEl = document.getElementById('bcObserveText');
    // 3秒后停止呼吸动画——模拟发现"患者没有呼吸"
    setTimeout(function() {
      var c = document.getElementById('bcBodyChest');
      if (c) { c.classList.remove('breathing'); c.classList.add('not-breathing'); }
      if (phaseEl) phaseEl.textContent = '胸廓无起伏...确认中...';
    }, 3000);
    // 随机濒死喘息（罕见抽动）——教学中让学生体验"看起来像呼吸但不是"
    var gaspDelay = 5000 + Math.floor(Math.random() * 3000);
    setTimeout(function() {
      var c = document.getElementById('bcBodyChest');
      if (c && c.classList.contains('not-breathing')) {
        c.classList.add('twitch');
        if (phaseEl) phaseEl.textContent = '⚠️ 注意：刚才是濒死喘息，不是正常呼吸！';
        setTimeout(function() { if (c) c.classList.remove('twitch'); }, 500);
      }
    }, gaspDelay);
    bcObserveInterval = setInterval(function() {
      obsLeft--;
      $('#bcObserveTimer').textContent = obsLeft;
      if (phaseEl) {
        if (obsLeft >= 8) phaseEl.textContent = '观察胸廓是否有起伏...';
        else if (obsLeft >= 5) phaseEl.textContent = '注意呼吸频率和深度...';
        else if (obsLeft >= 1) phaseEl.textContent = '⚠️ 确认：有无濒死喘息？';
      }
      if (obsLeft <= 3) $('#bcObserveTimer').style.color = '#ef4444';
      if (obsLeft <= 0) {
        clearInterval(bcObserveInterval); bcObserveInterval = null;
        state.breathCheckTrainer.observeDuration = 10;
        $('#bcObserveCountdown').style.display = 'none';
        $('#bcSkipObserve').style.display = 'none';
        $('#bcStatus3').textContent = '✓ 已完成'; $('#bcStatus3').className = 'bc-step-status done';
        $('#bcFeedback').innerHTML = '<p>👀 10秒观察完成。<br><span style="color:var(--c-danger);">—— 胸廓静止，无正常呼吸。这是心脏骤停的典型表现！</span></p>';
        showVerdict5();
      }
    }, 1000);
  };

  function showVerdict5() {
    // 必须完成三步后才显示判断按钮
    if (!state.breathCheckTrainer.tapShoulder || !state.breathCheckTrainer.shout || !state.breathCheckTrainer.observeStarted) {
      return;
    }
    if (bcTimerInterval) { clearInterval(bcTimerInterval); bcTimerInterval = null; }
    if (bcObserveInterval) { clearInterval(bcObserveInterval); bcObserveInterval = null; }
    $('#bcVerdict').style.display = 'block';
  }

  function handleVerdict(choice) {
    state.breathCheckTrainer.selectedResult = choice;
    $('#bcVerdict').style.display = 'none';
    if (choice === 'noBreath') {
      state.breathCheckTrainer.completed = true;
      var score = 0;
      if (state.breathCheckTrainer.tapShoulder) score += 1;
      if (state.breathCheckTrainer.shout) score += 1;
      if (state.breathCheckTrainer.observeStarted) score += 1;
      if (state.breathCheckTrainer.observeDuration > 0 && state.breathCheckTrainer.observeDuration <= 10) score += 1;
      score += 1;
      state.scores.breathCheck = score;
      $('#bcFeedback').innerHTML = '<p style="color:var(--c-success);">✅ 判断正确！无反应+无正常呼吸 = <strong>立即开始CPR！</strong> 得分：' + score + '/5</p>';
      Audio.ding(); showToast('+'+score+' 分', 'success');
      state.completed[5] = true;
      setTimeout(function() { $('#kcP5').classList.add('show'); }, 600);
    } else {
      var riskMsg = '';
      if (choice === 'hasReaction') { riskMsg = '患者始终无任何反应——你轻拍过双肩、大声呼喊过，均无应答。这是心脏骤停的典型表现，不是睡着或晕倒。'; pushRisk({type:'breathing', action:'误判患者有反应', risk:'延误CPR', correct:'确认无反应后立即启动急救系统', knowledge:'breathing', tip:'轻拍双肩+大声呼喊，确认患者无反应'}); }
      else if (choice === 'hasBreath') { riskMsg = '观察期间胸腔始终无起伏。你看到的短暂闪动是模拟干扰——真实场景中濒死喘息不是正常呼吸。胸廓真正起伏应连续、有节律。'; pushRisk({type:'breathing', action:'误判患者有正常呼吸', risk:'延误CPR时机', correct:'无反应+无正常呼吸=立即CPR', knowledge:'breathing', tip:'濒死喘息不是正常呼吸'}); }
      else { riskMsg = '不确定时可以理解——但宁可开始CPR后发现不需要，也不能因犹豫延误。立即开始胸外按压。'; pushRisk({type:'breathing', action:'判断犹豫不决', risk:'延误急救启动', correct:'不确定时也应立即开始CPR', knowledge:'breathing', tip:'宁可开始CPR后发现不需要，也不能因犹豫延误'}); }
      state.scores.breathCheck = Math.max(0, state.scores.breathCheck - 2);
      $('#bcFeedback').innerHTML = '<p style="color:var(--c-danger);">❌ ' + riskMsg + '。患者<strong>无反应+无正常呼吸</strong>，应立即CPR。</p>';
      Audio.buzzer(); showToast('判断错误，请重新选择', 'info');
      setTimeout(function() { $('#bcVerdict').style.display = 'block'; }, 1500);
    }
  }
  // Bind each verdict button individually for reliability
  var btnsArr = shuffle(Array.from(document.querySelectorAll('.bc-verdict-btn'))); var btns = btnsArr;
  for (var i = 0; i < btns.length; i++) {
    btns[i].onclick = function() { handleVerdict(this.getAttribute('data-verdict')); };
  }
}

// /* P6 — CPR Compression Trainer */
window.showCompressionReady = function() {
  var html = '<div style="text-align:left;line-height:1.7;font-size:0.85rem;">' +
    '<p style="text-align:center;font-size:0.95rem;font-weight:700;margin:0 0 14px;">📍 <strong>双手掌根重叠</strong>，放在胸骨中下段<br>💪 <strong>双臂伸直</strong>，用身体重量按压</p>' +
    '<div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:10px;padding:10px;margin:0 0 10px;color:#e0e7ff;">' +
    '<p style="font-weight:800;margin:0 0 4px;font-size:0.85rem;">🎵 致命节奏：<span style="color:#fbbf24;">《甜蜜蜜》= 103 BPM</span></p>' +
    '<p style="font-size:0.7rem;margin:0;color:#a5b4fc;line-height:1.5;">心里哼着<strong>"甜蜜蜜～你笑得甜蜜蜜～"</strong>，跟着鼓点按就对了。</p>' +
    '</div>' +
    '<p style="font-weight:800;color:var(--c-primary);margin:0 0 6px;text-align:center;">⚠️ 不是点击，是按压</p>' +
    '<p style="font-size:0.76rem;line-height:1.8;margin:0 0 12px;">' +
    '🖥 <strong>PC：</strong>双手掌根交叠放桌面，用掌根敲空格<br>' +
    '📱 <strong>手机：</strong>双手握手机，拇指按光圈 → 停留 → 抬起<br>' +
    '<span style="color:var(--c-text-muted);font-size:0.68rem;">💡 停留≈深度：快松=太浅 · 稳住=合格 · 太久=太深</span></p>' +
    '<button class="btn btn--primary btn--block" onclick="document.getElementById(\'modal-overlay\').classList.remove(\'active\');window._goTo(6);">✅ 准备好了，开始按压</button>' +
    '</div>';
  showModal({ type: 'info', title: '🙌 按压准备', text: html, confirmText: '' });
  // 隐藏 showModal 自动生成的空按钮
  setTimeout(function() { var mb = document.getElementById('modalBtns'); if (mb) mb.style.display = 'none'; }, 10);
};
let pressTimerInterval = null, pressTimeLeft = 30;
let pressEcgRenderer = null;
let metronomeInterval = null, guideTimeout = null;
let dynamicBpm = 103, screenGlow = null;
let _rhythmStarted = false, _soundEnabled = true;

function startVisualRhythm() {
  if (_rhythmStarted) return;
  _rhythmStarted = true;
  dynamicBpm = 103;
  $('#difficultyLabel').textContent = '跟🎵甜蜜蜜节拍按压';
  $('#rhythmCoachBpm').innerHTML = '103<span>BPM</span>';
  updateMetronome();
  showToast('🎵 鼓点已启动 — 心里哼着《甜蜜蜜》，跟着节拍按！', 'info');
}

function enterPage6() {
  state._cprLocked = false;
  state.compressionData = { timestamps: [], depthValues: [], rateValues: [], depthResults: [], rateResults: [], reboundViolations: 0, totalPresses: 0, depthOkCount: 0, rateOkCount: 0, positionOkCount: 0, interruptionCount: 0, totalInterruptionTime: 0, _wasInterrupted: false, avgBpm: 0, avgDepth: 0, depthGoodRate: 0, rateGoodRate: 0, correctPresses: 0, pressStartTime: 0, lastPressTime: 0 };
  pressTimeLeft = 30; dynamicBpm = 103; _rhythmStarted = false;
  var cr = (state.cycleRound || 0);
  var isNoCoachRound = (cr % 3 === 2);
  $('#cprCount').textContent = '0 / 30';
  $('#cprBpm').textContent = '--'; $('#cprBpm').classList.remove('bpm-good','bpm-warn','bpm-bad');
  $('#cprRate').textContent = '--%'; $('#cprProgressFill').style.transform = 'scaleX(0)';
  $('#cprDepthIndicator').className = 'cpr-depth-indicator'; $('#cprDepthIndicator').style.top = '0%'; $('#cprDepthLabel').textContent = '0 cm'; $('#cprDepthLabel').className = 'cpr-depth-label';
  $('#cprInterruptWarn').classList.remove('show');
  if (isNoCoachRound) {
    $('#pressFeedback').textContent = '🎯 考核轮：自行把握节奏，深度5-6cm，频率100-120次/分';
    $('#pressFeedback').style.color = 'var(--c-warning)';
    $('#difficultyLabel').textContent = '第' + (cr + 1) + '轮 · 考核模式';
    dynamicBpm = 0;
    var rc = $('#rhythmCoachBar'); if (rc) { rc.style.opacity = '0.35'; rc.style.filter = 'grayscale(0.5)'; }
    var rcb = $('#rhythmCoachBpm'); if (rcb) { rcb.innerHTML = '--<span>BPM</span>'; }
  } else {
    $('#pressFeedback').textContent = '按下光圈开始首次按压，之后跟随🎵《甜蜜蜜》节拍';
    $('#pressFeedback').style.color = 'var(--c-text-secondary)';
    $('#difficultyLabel').textContent = '第' + (cr + 1) + '轮 · 教练模式';
    dynamicBpm = 103;
    var rc = $('#rhythmCoachBar'); if (rc) { rc.style.opacity = '1'; rc.style.filter = ''; }
    var rcb = $('#rhythmCoachBpm'); if (rcb) { rcb.innerHTML = '103<span>BPM</span>'; }
    var dots = document.querySelectorAll('#rhythmBeatDots .rhythm-beat-dot');
    for (var d = 0; d < dots.length; d++) { dots[d].classList.remove('beat'); }
  }
  $('#patientFace').textContent = '😐'; $('#patientFace').className = 'patient-face-indicator';
  var card = $('#kcP6'); if (card) { card.classList.remove('show'); card.style.display = ''; }
  try { $('#cprIllustrationCard').classList.remove('pressing'); $('#cprIllustrationCard').style.boxShadow=''; } catch(e) {}
  if (!screenGlow) { screenGlow = document.createElement('div'); screenGlow.className = 'screen-glow'; document.body.appendChild(screenGlow); }
  screenGlow.className = 'screen-glow';
  initPressEcg();
  // Sound toggle button
  if (isNoCoachRound) {
    $('#soundToggleBtn').textContent = '🔇 考核轮无节拍';
    $('#soundToggleBtn').onclick = function() { showToast('考核轮无节拍，请自行把握按压节奏', 'info'); };
  } else {
    $('#soundToggleBtn').textContent = _soundEnabled ? '🔊 节拍音开' : '🔇 节拍音关';
    $('#soundToggleBtn').onclick = function() {
      _soundEnabled = !_soundEnabled;
      $('#soundToggleBtn').textContent = _soundEnabled ? '🔊 节拍音开' : '🔇 节拍音关';
      showToast(_soundEnabled ? '🎵 节拍音已开启 · 跟着《甜蜜蜜》的节奏' : '节拍音已关闭（仅视觉脉冲）', 'info');
    };
  }
  // No metronome until first press triggers it
  if (isNoCoachRound) { if (metronomeInterval) { clearInterval(metronomeInterval); metronomeInterval = null; } }
  // pressGuideHint text merged into top summary lines
  if (pressTimerInterval) clearInterval(pressTimerInterval);
  pressTimerInterval = setInterval(function() {
    pressTimeLeft--;
    var data = state.compressionData;
    var pct = Math.round(Math.min(100, data.totalPresses / 30 * 100));
    $('#cprProgressFill').style.transform = 'scaleX(' + (pct/100) + ')';
    if (data.lastPressTime > 0 && (Date.now() - data.lastPressTime) > 1500) { data.totalInterruptionTime += 1000; $('#cprInterruptWarn').classList.add('show'); if (!data._wasInterrupted) { data._wasInterrupted = true; data.interruptionCount++; } if (data.interruptionCount >= 3) { pushRisk({type:'compression', action:'按压中断过长', risk:'冠脉灌注压下降', correct:'胸外按压中断不超过10秒', knowledge:'compression', tip:'AHA强调：高质量CPR要求胸外按压比例(CCF)>60%'}); } } else { $('#cprInterruptWarn').classList.remove('show'); data._wasInterrupted = false; }
    if (pressTimeLeft <= 0) { clearInterval(pressTimerInterval); endCompression(); return; }
    var depthOk = data.totalPresses > 0 ? data.depthOkCount / data.totalPresses : 1;
    if (depthOk < 0.3) $('#patientFace').textContent = '😨'; else if (depthOk < 0.6) $('#patientFace').textContent = '😟'; else $('#patientFace').textContent = '😐';
  }, 1000);
  var hotspot = $('#cprHotspot');
  if (hotspot) {
    window._startDepthAnim = function() { state.compressionData.pressStartTime = Date.now(); try { $('#cprIllustrationCard').classList.add('pressing'); } catch(ex) {} var btn = $('#cprHotspot'); if (btn) { btn.style.animation = 'none'; btn.style.transform = 'translate(-50%, -50%) scale(0.95)'; } var _ring = $('#cprPressRingFill'), _ic = $('#cprIllustrationCard'), _ind = $('#cprDepthIndicator'), _dl = $('#cprDepthLabel'), _btn2 = $('#cprHotspot'); var anim = function() { if (!state.compressionData.pressStartTime) return; var elapsed = Date.now() - state.compressionData.pressStartTime; var topPct = Math.min(90, elapsed / 6); var ring = _ring; if (ring) { var prog = Math.min(1, elapsed / 500); ring.style.strokeDashoffset = Math.round(289 * (1 - prog)); if (elapsed < 180) { ring.style.stroke = '#ef4444'; try { _ic.classList.add('pressing-deep'); _ic.classList.remove('pressing-good'); } catch(e) {} } else if (elapsed <= 500) { ring.style.stroke = '#22c55e'; try { _ic.classList.add('pressing-good'); _ic.classList.remove('pressing-deep'); } catch(e) {} } else { ring.style.stroke = '#eab308'; try { _ic.classList.add('pressing-deep'); _ic.classList.remove('pressing-good'); } catch(e) {} } } var ind = _ind; if (ind) { ind.style.transition = 'none'; ind.style.top = topPct + '%'; if (topPct < 30) ind.className = 'cpr-depth-indicator shallow'; else if (topPct <= 75) ind.className = 'cpr-depth-indicator good'; else ind.className = 'cpr-depth-indicator deep'; } var dl = _dl; if (dl) { var simCm = (topPct / 90 * 7).toFixed(1); dl.textContent = simCm + 'cm'; if (topPct >= 30 && topPct <= 75) dl.className = 'cpr-depth-label ok'; else if (topPct < 30) dl.className = 'cpr-depth-label warn'; else dl.className = 'cpr-depth-label bad'; } var btn2 = _btn2; if (btn2) { btn2.classList.remove('good-press', 'deep-press'); if (elapsed >= 200 && elapsed <= 500) btn2.classList.add('good-press'); else if (elapsed > 500) btn2.classList.add('deep-press'); } window._cprDepthRaf = requestAnimationFrame(anim); }; anim(); };
    window._stopDepthAnim = function() { if (window._cprDepthRaf) { cancelAnimationFrame(window._cprDepthRaf); window._cprDepthRaf = null; } var ind = $('#cprDepthIndicator'); if (ind) { ind.style.transition = 'top 0.35s ease-out'; ind.style.top = '0%'; ind.className = 'cpr-depth-indicator'; } var dl = $('#cprDepthLabel'); if (dl) { dl.textContent = '0 cm'; dl.className = 'cpr-depth-label'; } var ring = $('#cprPressRingFill'); if (ring) { ring.style.strokeDashoffset = '289'; ring.style.stroke = '#22c55e'; } try { $('#cprIllustrationCard').classList.remove('pressing-good', 'pressing-deep'); } catch(e) {} var btn = $('#cprHotspot'); if (btn) { btn.classList.remove('good-press', 'deep-press'); btn.style.animation = 'heartIdle 1.5s ease-in-out infinite'; btn.style.transform = 'translate(-50%, -50%) scale(1)'; } };
    hotspot.onpointerdown = function(e) { e.preventDefault(); e.stopPropagation(); window._startDepthAnim(); };
    hotspot.onpointerup = function(e) { e.preventDefault(); try { $('#cprIllustrationCard').classList.remove('pressing'); } catch(ex) {} window._stopDepthAnim(); handleCompressionPress(); };
    hotspot.addEventListener("contextmenu",function(e){e.preventDefault();}); hotspot.onpointerleave = function() { if (state.compressionData.pressStartTime) { try { $('#cprIllustrationCard').classList.remove('pressing'); } catch(ex) {} window._stopDepthAnim(); handleCompressionPress(); } };
    hotspot.ontouchcancel = function() { try { $('#cprIllustrationCard').classList.remove('pressing'); } catch(ex) {} };
	    hotspot.style.pointerEvents = 'auto';
    // onclick intentionally removed — onpointerup already handles press. Keeping both causes double counting.
  }
  document.addEventListener('keydown', onPressKeyDown);
  document.addEventListener('keyup', onPressKeyUp);
}
window.enterPage6 = enterPage6;

function initPressEcg() { var canvas = $('#ecgCanvas6'); if (!canvas) return; var dpr = window.devicePixelRatio || 1; var w = canvas.parentElement.clientWidth - 24; canvas.width = w * dpr; canvas.height = 50 * dpr; canvas.style.width = w + 'px'; canvas.style.height = '50px'; var ctx = canvas.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); pressEcgRenderer = { canvas: canvas, ctx: ctx, w: w, h: 50, data: new Array(200).fill(0.5), spike: 0, flatline: false }; }

function updatePressEcg() { if (!pressEcgRenderer) return; var ctx = pressEcgRenderer.ctx, w = pressEcgRenderer.w, h = pressEcgRenderer.h; var data = pressEcgRenderer.data; if (pressEcgRenderer.spike > 0.01) { data.push(0.5); if (data.length > 200) data.shift(); data.push(0.3); if (data.length > 200) data.shift(); data.push(0.95); if (data.length > 200) data.shift(); data.push(0.15); if (data.length > 200) data.shift(); data.push(0.5); if (data.length > 200) data.shift(); data.push(0.65); if (data.length > 200) data.shift(); pressEcgRenderer.spike *= 0.35; } else { data.push(0.5 + (Math.random() - 0.5) * 0.02); if (data.length > 200) data.shift(); } ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(16,185,129,0.06)'; ctx.lineWidth = 0.5; for (var y = 0; y < h; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } ctx.beginPath(); ctx.strokeStyle = '#10B981'; ctx.lineWidth = 1.6; ctx.shadowColor = '#10B981'; ctx.shadowBlur = 4; for (var i = 0; i < data.length; i++) { var x = i / data.length * w; var y2 = (1 - data[i]) * h; if (i === 0) ctx.moveTo(x, y2); else ctx.lineTo(x, y2); } ctx.stroke(); ctx.shadowBlur = 0; }

function spawnPressParticles(color, count, quality) { var container = $('#pressParticles'); if (!container) return; var cfg={shallow:{color:'#eab308',cnt:3,sz:4,spd:0.5},good:{color:'#22c55e',cnt:8,sz:6,spd:1},perfect:{color:'#f59e0b',cnt:14,sz:8,spd:1.3},deep:{color:'#ef4444',cnt:5,sz:5,spd:0.7}}; var c=cfg[quality]||cfg.good; var clr=color||c.color; var n=count||c.cnt; for(var i=0;i<n;i++){var p=document.createElement('div');p.className='press-particle-burst';p.style.background=clr;p.style.width=(Math.random()*c.sz+2)+'px';p.style.height=p.style.width;p.style.left='50%';p.style.top='50%';var a=(Math.PI*2/n)*i+Math.random()*0.5;var d=30+Math.random()*50*c.spd;p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');p.style.setProperty('--rot',(Math.random()-0.5)*360+'deg');container.appendChild(p);setTimeout(function(){p.remove()},600)}}

function updateScreenGlow(type) { if (!screenGlow) return; screenGlow.className='screen-glow '+type; if(type!=='danger'&&type!=='perfect'&&type!=='shallow'&&type!=='deep'){setTimeout(function(){if(screenGlow)screenGlow.className='screen-glow'},300)} }

var _rhythmBeatIdx = 0;
function updateMetronome() { if (metronomeInterval) clearInterval(metronomeInterval); if (!dynamicBpm || dynamicBpm <= 0) return; var interval = 60000 / dynamicBpm; _rhythmBeatIdx = 0;
  metronomeInterval = setInterval(function() {
    if (_soundEnabled) Audio.metronome();
    var glow=$('#cprHotspotGlow');if(glow){glow.classList.add('pulse');setTimeout(function(){if(glow)glow.classList.remove('pulse')},180)}
    var core=$('#cprPressCore');if(core){core.style.transform='translate(-50%,-50%) scale(1.06)';setTimeout(function(){if(core)core.style.transform=''},100)}
    // 节奏教练节拍点动画
    var dots = document.querySelectorAll('#rhythmBeatDots .rhythm-beat-dot');
    for (var d = 0; d < dots.length; d++) { dots[d].classList.remove('beat'); }
    var activeDot = dots[_rhythmBeatIdx % dots.length];
    if (activeDot) { activeDot.classList.add('beat'); }
    _rhythmBeatIdx++;
    // 更新BPM显示
    var bpmEl = $('#rhythmCoachBpm'); if (bpmEl) { bpmEl.innerHTML = dynamicBpm + '<span>BPM</span>'; }
  }, interval);
}

// CPR 参数常量（供压缩评分模块引用）
var CPR_PARAMS = {
  depthMinMs: 180,
  depthMaxMs: 500,
  rateMin: 100,
  rateMax: 120,
  ventMinMs: 800,
  ventMaxMs: 1500,
  interruptThresholdMs: 1500,
  reboundMinMs: 350,
  coachBpm: 103
};
function showKcP6() {
  var card = $('#kcP6');
  if (!card) return;
  card.classList.add('show');
  card.style.display = 'block';
  setTimeout(function() {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}
function handleCompressionPress() {
  if (state._cprLocked) return;
  if (!state.compressionData.pressStartTime) return;
  try { $('#pressGuideHint').classList.remove('show'); } catch(e) {}
  var now = Date.now(); var pressDuration = now - state.compressionData.pressStartTime;
  state.compressionData.pressStartTime = 0; var data = state.compressionData;
  // Guard against extremely short presses
  if (pressDuration < 50) return;
  var isNoCoachRound = ((state.cycleRound || 0) % 3 === 2);
  // Warn on press held too long (no rebound)
  if (pressDuration > 600) { data.reboundViolations++; $('#pressFeedback').textContent = isNoCoachRound ? '\u26a0\ufe0f 按压过长，请充分回弹让胸廓恢复' : '\u26a0\ufe0f 按压过长！每次按压后要让胸廓充分回弹——跟着节奏，压下去马上松开'; $('#pressFeedback').style.color = 'var(--c-warning)'; }
  if (data.lastPressTime > 0 && (now - data.lastPressTime) < 350) { data.reboundViolations++; $('#pressFeedback').textContent = isNoCoachRound ? '⚠️ 太赶了！让胸廓完全回弹，保持稳定节奏' : '⚠️ 太赶了！让胸廓完全回弹——跟着🎵《甜蜜蜜》的节拍，不快不慢'; $('#pressFeedback').style.color = 'var(--c-warning)'; Vibe.warn(); if (!isNoCoachRound) Audio.buzzer(); data.lastPressTime = now; return; }
  // First press triggers visual rhythm (coach mode only)
  if (!_rhythmStarted && !isNoCoachRound) { startVisualRhythm(); }
  var depthCm; if (pressDuration < 180) depthCm = 3.5 + Math.random() * 0.3; else if (pressDuration <= 500) depthCm = 5.0 + Math.random() * 0.3; else depthCm = 6.2 + Math.random() * 0.3;
  depthCm = Math.round(depthCm * 10) / 10; var depthOk = depthCm >= 5.0 && depthCm <= 6.0;
  data.depthValues.push(depthCm); data.depthResults.push(depthOk ? 'good' : (depthCm < 5.0 ? 'shallow' : 'deep')); if (depthOk) data.depthOkCount++; data.totalPresses++;
  data.timestamps.push(now); if (data.timestamps.length > 8) data.timestamps.shift();
  var bpm = 0; if (data.timestamps.length >= 2) { var intervals = []; for (var i = 1; i < data.timestamps.length; i++) intervals.push(data.timestamps[i] - data.timestamps[i-1]); var avgInt = intervals.reduce(function(a,b){return a+b;}, 0) / intervals.length; bpm = Math.round(60000 / avgInt); }
  data.rateValues.push(bpm); var bpmOk = bpm >= 100 && bpm <= 120; data.rateResults.push(bpmOk); if (bpmOk) data.rateOkCount++;
  data.positionOkCount = data.totalPresses; var valid = depthOk && bpmOk; if (valid) data.correctPresses++;
	  $('#cprCount').textContent = data.totalPresses + ' / 30'; $('#cprBpm').textContent = bpm || '--';
  var bpmEl = $('#cprBpm'); bpmEl.classList.remove('bpm-good','bpm-warn','bpm-bad'); if (bpm >= 100 && bpm <= 120) bpmEl.classList.add('bpm-good'); else if (bpm >= 90 && bpm <= 130) bpmEl.classList.add('bpm-warn'); else if (bpm > 0) bpmEl.classList.add('bpm-bad');
  var overallRate = data.totalPresses > 0 ? Math.round(data.correctPresses / data.totalPresses * 100) : 0; $('#cprRate').textContent = overallRate + '%';
  $('#cprProgressFill').style.transform = 'scaleX(' + (Math.round(Math.min(100, data.totalPresses / 30 * 100)) / 100) + ')';
  // Instant per-press feedback — detailed and actionable
  if (valid) {
    var comboCount = data.correctPresses; var comboFreq = Math.min(200, 80 + comboCount * 8); if (!isNoCoachRound) Audio.play(comboFreq, 'sine', 0.1, 0.3); spawnPressParticles('#f59e0b', isNoCoachRound?3:5,'perfect'); updateScreenGlow('perfect');
    if (comboCount > 5) { $('#patientFace').textContent = '🙂'; $('#patientFace').className = 'patient-face-indicator improving'; } else { $('#patientFace').textContent = '😊'; $('#patientFace').className = 'patient-face-indicator improving'; }
    var bpmStr = bpm > 0 ? (' ' + bpm + 'BPM') : '';
    if (isNoCoachRound) { $('#pressFeedback').textContent = '✓ 深度'+depthCm+'cm'+bpmStr; } else { $('#pressFeedback').textContent = '🎵 完美节拍！深度'+depthCm+'cm 频率'+bpmStr+' ('+comboCount+'连击)'; }
    $('#pressFeedback').style.color = 'var(--c-success)'; Vibe.good(); if (!navigator.vibrate) visualShake(30); if (pressEcgRenderer) pressEcgRenderer.spike = 1.0;
  } else {
    spawnPressParticles('#94a3b8',2,(depthCm<5?'shallow':depthCm>6?'deep':'good')); updateScreenGlow('danger'); $('#patientFace').textContent = '😟'; $('#patientFace').className = 'patient-face-indicator critical';
    var msgs = [];
    if (!bpmOk && bpm > 0) { if (bpm < 90) { msgs.push('太慢('+bpm+'BPM)——加快，跟上《甜蜜蜜》的节奏'); } else if (bpm > 130) { msgs.push('太快('+bpm+'BPM)——放慢，心里哼着《甜蜜蜜》'); } }
    if (!depthOk) { if (depthCm < 5.0) { msgs.push('太浅('+depthCm+'cm)'); } else { msgs.push('太深('+depthCm+'cm)'); } }
    $('#pressFeedback').textContent = isNoCoachRound ? '✗ 未达标，请调整力度和节奏' : ('⚠️ ' + msgs.join('，'));
    $('#pressFeedback').style.color = 'var(--c-danger)'; if (!isNoCoachRound) Audio.clickBad(); if (depthCm < 5.0) Vibe.shallow(); else if (depthCm > 6.0) Vibe.deep(); if (pressEcgRenderer) pressEcgRenderer.spike = 0.4;
  }
  spawnRipple($('#cprHotspot')); data.lastPressTime = now; updatePressEcg();
  if (data.totalPresses >= 30) { state._cprLocked = true; showKcP6(); var hs = $('#cprHotspot'); if (hs) { hs.onpointerdown = hs.onpointerup = hs.onpointerleave = hs.ontouchcancel = null; hs.style.pointerEvents = 'none'; } document.removeEventListener('keydown', onPressKeyDown); document.removeEventListener('keyup', onPressKeyUp); setTimeout(function() { endCompression(); }, 300); }
}

function endCompression() {
  if (pressTimerInterval) { clearInterval(pressTimerInterval); pressTimerInterval = null; }
  if (metronomeInterval) { clearInterval(metronomeInterval); metronomeInterval = null; }
  if (guideTimeout) { clearTimeout(guideTimeout); guideTimeout = null; }
  _rhythmStarted = false;
  if (screenGlow) screenGlow.className = 'screen-glow';
  $('#pressGuideHint').classList.remove('show'); $('#cprInterruptWarn').classList.remove('show');
  try { $('#cprIllustrationCard').classList.remove('pressing'); } catch(e) {}
  var data = state.compressionData;
  data.avgBpm = data.rateValues.length > 0 ? Math.round(data.rateValues.reduce(function(a,b){return a+b;}, 0) / data.rateValues.length) : 0;
  data.avgDepth = data.depthValues.length > 0 ? Math.round(data.depthValues.reduce(function(a,b){return a+b;}, 0) / data.depthValues.length * 10) / 10 : 0;
  data.depthGoodRate = data.totalPresses > 0 ? data.depthOkCount / data.totalPresses : 0;
  data.rateGoodRate = data.totalPresses > 0 ? data.rateOkCount / data.totalPresses : 0;
  var total = Math.max(1, data.totalPresses);
  var depthScore = (data.depthOkCount / total) * 35, rateScore = (data.rateOkCount / total) * 35;
  var reboundScore = total > 0 ? Math.max(0, (1 - data.reboundViolations / total)) * 10 : 10;
  var positionScore = 10, interruptionScore = data.totalInterruptionTime < 10000 ? 10 : Math.max(0, 10 - Math.floor(data.totalInterruptionTime / 2000));
  var rawScore = depthScore + rateScore + reboundScore + positionScore + interruptionScore;
  state.scores.compression = Math.min(30, Math.round(rawScore * 0.3));
  var hotspot = $('#cprHotspot'); if (hotspot) hotspot.onpointerdown = hotspot.onpointerup = hotspot.onpointerleave = hotspot.ontouchcancel = null;
  document.removeEventListener('keydown', onPressKeyDown); document.removeEventListener('keyup', onPressKeyUp);
  var overallRate = total > 0 ? Math.round(data.correctPresses / Math.max(30, total) * 100) : 0;
  if (data.totalPresses >= 30 || (data.totalPresses >= 5 && (overallRate >= 60 || state.scores.compression >= 8))) {
    // 完成30次或达标
    state.completed[6] = true;
    state._cprLocked = true;
    $('#pressFeedback').textContent = '✅ 按压完成！深度达标率'+Math.round(data.depthGoodRate*100)+'% | 频率达标率'+Math.round(data.rateGoodRate*100)+'% | 得分 '+state.scores.compression+'/30';
    $('#pressFeedback').style.color = 'var(--c-success)'; Audio.ding();
    var riskEvents = state.riskEvents || []; var cprRisks = riskEvents.filter(function(r){return r.type==='compression';}); if (cprRisks.length > 0) showRiskReplay(6, cprRisks[cprRisks.length-1]);
    showKcP6();
  } else if (data.totalPresses === 0) {
    // 完全没有按压——不让过
    $('#pressFeedback').textContent = '⚠️ 请按住绿色光圈进行按压训练（目标30次）';
    $('#pressFeedback').style.color = 'var(--c-danger)';
    showKcP6();
  } else {
    // 有按压但未达标
    $('#pressFeedback').textContent = '⚠️ 达标率不足，需要重新练习（按压'+data.totalPresses+'次，得分 '+state.scores.compression+'/30）';
    $('#pressFeedback').style.color = 'var(--c-warning)';
    showKcP6();
    var riskEvents = state.riskEvents || []; var cprRisks = riskEvents.filter(function(r){return r.type==='compression';}); if (cprRisks.length > 0) showRiskReplay(6, cprRisks[cprRisks.length-1]);
  }
}

function stopCompression() {
  if (window._cprDepthRaf) { cancelAnimationFrame(window._cprDepthRaf); window._cprDepthRaf = null; }
  window._startDepthAnim = null; window._stopDepthAnim = null;
  if (pressTimerInterval) { clearInterval(pressTimerInterval); pressTimerInterval = null; }
  if (metronomeInterval) { clearInterval(metronomeInterval); metronomeInterval = null; }
  if (guideTimeout) { clearTimeout(guideTimeout); guideTimeout = null; }
  _rhythmStarted = false;
  if (screenGlow) screenGlow.className = 'screen-glow';
  $('#pressGuideHint').classList.remove('show'); $('#cprInterruptWarn').classList.remove('show');
  try { $('#cprIllustrationCard').classList.remove('pressing'); } catch(e) {}
  document.removeEventListener('keydown', onPressKeyDown); document.removeEventListener('keyup', onPressKeyUp);
  var hotspot = $('#cprHotspot'); if (hotspot) hotspot.onpointerdown = hotspot.onpointerup = hotspot.onpointerleave = hotspot.ontouchcancel = null;
}
window.stopCompression = stopCompression;

function visualShake(ms) { var el = $('#app-container'); if (!el) return; el.style.animation = 'none'; requestAnimationFrame(function() { el.style.animation = 'visualShake ' + (ms / 1000) + 's ease-out'; }); setTimeout(function() { el.style.animation = ''; }, ms); }

function onPressKeyDown(e) { if (e.code === 'Space' && state.currentPage === 6) { e.preventDefault(); if (typeof window._startDepthAnim === 'function') window._startDepthAnim(); } }
function onPressKeyUp(e) { if (e.code === 'Space' && state.currentPage === 6) { e.preventDefault(); try { $('#cprIllustrationCard').classList.remove('pressing'); } catch(ex) {} if (typeof window._stopDepthAnim === 'function') window._stopDepthAnim(); handleCompressionPress(); } }

function spawnRipple(el) {
  if (!el) return;
  var parent=el.closest('.cpr-illustration-frame');
  if(!parent){parent=document.body}
  var pr=parent.getBoundingClientRect(),er=el.getBoundingClientRect();
  var ripple=document.createElement('div');
  ripple.className='ripple-elem';
  ripple.style.left=(er.left-pr.left+er.width/2-10)+'px';
  ripple.style.top=(er.top-pr.top+er.height/2-10)+'px';
  ripple.style.position='absolute';
  parent.appendChild(ripple);
  setTimeout(function(){ripple.remove()},400);
}

// /* P7 — Rescue Breath Trainer */
let rbPressStart = 0, rbVentOkCount = 0, rbAirwayOpen = false, rbNosePinched = false, rbCurrentVent = 0, rbRaf = null;

function enterPage7() {
  state.rescueBreathTrainer = { airwayOpened: false, nosePinched: false, breaths: [], overVentilationCount: 0, completed: false };
  rbVentOkCount = 0; rbAirwayOpen = false; rbNosePinched = false; rbPressStart = 0; rbCurrentVent = 0;
  try { $('#kcP7').classList.remove('show'); } catch(e) {}
  ['rbStep1','rbStep2','rbStep3','rbStep4'].forEach(function(id){ $('#'+id).className = 'rb-step-node'; });
  $('#rbStep1').classList.add('active'); $('#rbBtnAirway').style.display = ''; $('#rbBtnAirway').disabled = false; $('#rbBtnAirway').textContent = '🤚 仰头抬颏 —— 开放气道'; $('#rbBtnAirway').style.background = ''; $('#rbBtnAirway').style.borderColor = '';
  $('#rbBtnNose').style.display = 'none'; $('#rbBtnNose').disabled = false; $('#rbBtnNose').style.background = ''; $('#rbBtnNose').style.borderColor = '';
  $('#rbVentCard').style.display = 'none'; $('#rbVentOkCount').textContent = '0'; var vw=document.getElementById('rbVentWaiting');if(vw)vw.style.display='';
  try { $('#rbVentArc1').setAttribute('stroke-dashoffset','226'); $('#rbVentArc2').setAttribute('stroke-dashoffset','226'); } catch(e) {}
  $('#rbVent1').disabled = true; $('#rbVent1').style.background = ''; $('#rbVent1').style.borderColor = '';
  $('#rbVent2').disabled = true; $('#rbVent2').style.background = ''; $('#rbVent2').style.borderColor = '';
  $('#rbChestIndicator').style.display = 'none';
  $('#rbFeedback').innerHTML = '👆 第一步：点击 <strong>"仰头抬颏"</strong> 开放气道';

  $('#rbBtnAirway').onclick = function() {
    if (rbAirwayOpen) return;
    rbAirwayOpen = true; state.rescueBreathTrainer.airwayOpened = true;
    $('#rbBtnAirway').textContent = '✅ 气道已开放'; $('#rbBtnAirway').disabled = true;
    $('#rbBtnAirway').style.background = '#f0fdf4'; $('#rbBtnAirway').style.borderColor = '#bbf7d0';
    $('#rbStep1').classList.remove('active'); $('#rbStep1').classList.add('done');
    $('#rbStep2').classList.add('active'); $('#rbBtnNose').style.display = '';
    $('#rbFeedback').innerHTML = '👍 气道已开放！现在 <strong>捏住鼻翼</strong>'; Audio.ding();
    try { var al=document.getElementById("rbAirwayLine"); if(al){al.style.background="#22c55e";al.style.height="22px";} var as=document.getElementById("rbAirwayStatus"); if(as){as.textContent="已开放";as.style.color="#22c55e";} } catch(e) {}
  };

  $('#rbBtnNose').onclick = function() {
    if (!rbAirwayOpen) { showToast('请先开放气道', 'info'); return; }
    if (rbNosePinched) return;
    rbNosePinched = true; state.rescueBreathTrainer.nosePinched = true;
    $('#rbBtnNose').textContent = '✅ 鼻翼已捏住'; $('#rbBtnNose').disabled = true;
    $('#rbBtnNose').style.background = '#f0fdf4'; $('#rbBtnNose').style.borderColor = '#bbf7d0';
    $('#rbStep2').classList.remove('active'); $('#rbStep2').classList.add('done');
    $('#rbStep3').classList.add('active'); $('#rbVentCard').style.display = ''; $('#rbVent1').disabled = false; var vw=document.getElementById('rbVentWaiting');if(vw)vw.style.display='none';
    $('#rbFeedback').innerHTML = '💨 气道+捏鼻完成！<strong>按住第1次通气按钮 1-2 秒</strong>'; Audio.ding();
  };

  function bindVent(btnId, arcId, ventNum) {
    var btn = $('#'+btnId); if (!btn) return;
    function onDown(e) {
      e.preventDefault(); if (!rbAirwayOpen || !rbNosePinched || btn.disabled) { if(!btn.disabled){showToast('请先开放气道并捏住鼻翼','info'); if(!rbAirwayOpen)pushRisk({type:'rescueBreath',action:'未开放气道就尝试通气',risk:'气体难以进入肺部',correct:'先仰头抬颏开放气道',knowledge:'rescueBreath',tip:'气道开放是有效通气的先决条件'});} return; }
      rbPressStart = performance.now(); rbCurrentVent = ventNum; _arcCache = null;
      window._rbBreathNodes = null;
      if (Audio.ctx) { var bOsc=Audio.ctx.createOscillator(),bGain=Audio.ctx.createGain(),mOsc=Audio.ctx.createOscillator(),mGain=Audio.ctx.createGain(); bOsc.type='sine';bOsc.frequency.setValueAtTime(80,Audio.ctx.currentTime); mOsc.type='sine';mOsc.frequency.setValueAtTime(3,Audio.ctx.currentTime); mGain.gain.setValueAtTime(30,Audio.ctx.currentTime); bGain.gain.setValueAtTime(0,Audio.ctx.currentTime); bGain.gain.linearRampToValueAtTime(0.08,Audio.ctx.currentTime+0.2); mOsc.connect(mGain);mGain.connect(bOsc.frequency); bOsc.connect(bGain);bGain.connect(Audio.ctx.destination); bOsc.start();mOsc.start(); window._rbBreathNodes=[bOsc,mOsc]; }
      var _arcCache=null;function updateRing() { if(!rbPressStart)return; var elapsed=performance.now()-rbPressStart; var pct=Math.min(100,elapsed/2000*100); var arc=_arcCache||(_arcCache=$('#'+arcId)); if(arc){arc.setAttribute('stroke-dashoffset',Math.round(226*(1-Math.min(100,pct)/100)));if(pct<30)arc.setAttribute('stroke','#ef4444');else if(pct<=100)arc.setAttribute('stroke','#22c55e');else arc.setAttribute('stroke','#f59e0b');} if(pct>30)$('#rbChestIndicator').style.display='flex'; rbRaf=requestAnimationFrame(updateRing);try{var ll=document.getElementById('rbLungL'),lr=document.getElementById('rbLungR');var hold=Date.now()-rbPressStart;if(hold>1500){if(ll)ll.classList.add('over');if(lr)lr.classList.add('over');if(ll)ll.classList.remove('inflate');if(lr)lr.classList.remove('inflate')}else{if(ll)ll.classList.add('inflate');if(lr)lr.classList.add('inflate');if(ll)ll.classList.remove('over');if(lr)lr.classList.remove('over')}}catch(e){} }
      rbRaf=requestAnimationFrame(updateRing);
    }
    function onUp(e) { e.preventDefault(); endBreath7(); }
    function onLeave() { if (rbPressStart) endBreath7(); }
    // Pointer events cover both mouse and touch — no need for duplicates
    btn.addEventListener('pointerdown', onDown);
    btn.addEventListener('pointerup', onUp);
    btn.addEventListener('pointerleave', onLeave);
    btn.addEventListener('pointercancel', onLeave);
    var onCtx = function(e) { e.preventDefault(); };
    btn.addEventListener('contextmenu', onCtx);
    // Store cleanup for stopBreathing
    btn._ventCleanup = function() {
      btn.removeEventListener('pointerdown', onDown);
      btn.removeEventListener('pointerup', onUp);
      btn.removeEventListener('pointerleave', onLeave);
      btn.removeEventListener('pointercancel', onLeave);
      btn.removeEventListener('contextmenu', onCtx);
    };
  }
  bindVent('rbVent1', 'rbVentArc1', 1);
  bindVent('rbVent2', 'rbVentArc2', 2);
}

var _rbWaveRaf=null,_rbWavePhase=0,_rbWaveAmpl=0,_rbWaveCanvas=null;function drawRbWave(){var c=_rbWaveCanvas||(_rbWaveCanvas=document.getElementById('rbWaveCanvas'));if(!c)return;var ctx=c.getContext('2d'),w=c.width=c.offsetWidth*dpr,h=c.height=c.offsetHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);w=c.offsetWidth;h=c.offsetHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(248,250,252,0.5)';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(16,185,129,0.12)';ctx.lineWidth=0.5;for(var y=16;y<h;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}var amp=_rbWaveAmpl;ctx.beginPath();ctx.lineWidth=2.5;ctx.strokeStyle='rgba(16,185,129,0.4)';for(var x=0;x<w;x+=2){var y2=h/2+Math.sin((x/w*Math.PI*4)+_rbWavePhase)*amp*12;if(x===0)ctx.moveTo(x,y2);else ctx.lineTo(x,y2)}ctx.stroke();if(amp>2){ctx.beginPath();ctx.lineWidth=1.2;ctx.strokeStyle='rgba(16,185,129,0.7)';ctx.shadowColor='rgba(16,185,129,0.3)';ctx.shadowBlur=8;for(var x=0;x<w;x+=2){var y3=h/2+Math.sin((x/w*Math.PI*4)+_rbWavePhase+0.5)*amp*8;if(x===0)ctx.moveTo(x,y3);else ctx.lineTo(x,y3)}ctx.stroke();ctx.shadowBlur=0}if(amp>4){for(var i=0;i<3;i++){ctx.fillStyle='rgba(16,185,129,'+(0.3+Math.random()*0.4)+')';ctx.beginPath();ctx.arc(Math.random()*w,h/2+Math.sin(Math.random()*Math.PI*2)*amp*6,2+Math.random()*3,0,Math.PI*2);ctx.fill()}}_rbWavePhase+=0.03;_rbWaveRaf=requestAnimationFrame(drawRbWave)}var dpr=window.devicePixelRatio||1;drawRbWave();
function endBreath7() {
  if (window._rbBreathNodes) { try { window._rbBreathNodes.forEach(function(n){n.stop();}); } catch(e) {} window._rbBreathNodes = null; }
  if (rbRaf) { cancelAnimationFrame(rbRaf); rbRaf = null; }
  if (!rbPressStart) return; var elapsed = performance.now() - rbPressStart; rbPressStart = 0;try{var ll=document.getElementById('rbLungL'),lr=document.getElementById('rbLungR');if(ll){ll.classList.remove('inflate','over')}if(lr){lr.classList.remove('inflate','over')}}catch(e){}
  $('#rbChestIndicator').style.display = 'none';
  var ventNum = rbCurrentVent;
  var arcId = ventNum === 1 ? 'rbVentArc1' : 'rbVentArc2';
  var btnId = ventNum === 1 ? 'rbVent1' : 'rbVent2';
  try { $('#'+arcId).setAttribute('stroke-dashoffset','226'); } catch(e) {}
  var durationSec = Math.round(elapsed / 100) / 10;
  if (elapsed < 800) { $('#rbFeedback').innerHTML = '<span style="color:var(--c-warning);">⚠️ 通气时间过短（'+durationSec+'秒），胸廓未见明显起伏</span>'; state.rescueBreathTrainer.breaths.push({num:ventNum,duration:durationSec,effective:false,type:'short'}); pushRisk({type:'rescueBreath',action:'通气时间过短('+durationSec+'秒)',risk:'潮气量不足',correct:'每次吹气约1秒，见胸廓起伏即可',knowledge:'rescueBreath',tip:'有效通气需要看到胸廓有明显起伏'}); Audio.buzzer(); }
  else if (elapsed > 1500) { state.rescueBreathTrainer.overVentilationCount++; $('#rbFeedback').innerHTML = '<span style="color:var(--c-danger);">⚠️ 通气过长（'+durationSec+'秒），可能增加胃胀气风险</span>'; state.rescueBreathTrainer.breaths.push({num:ventNum,duration:durationSec,effective:false,type:'long'}); pushRisk({type:'rescueBreath',action:'通气过度('+durationSec+'秒)',risk:'可能增加胃胀气风险',correct:'每次吹气约1秒',knowledge:'rescueBreath',tip:'过度通气会降低CPR效果'}); Audio.buzzer(); }
  else { rbVentOkCount++; $('#rbVentOkCount').textContent = rbVentOkCount; state.rescueBreathTrainer.breaths.push({num:ventNum,duration:durationSec,effective:true,type:'good'}); $('#'+btnId).disabled = true; $('#'+btnId).style.background = '#f0fdf4'; $('#'+btnId).style.borderColor = '#bbf7d0'; $('#rbChestIndicator').style.display = 'flex'; $('#rbChestText').textContent = '胸廓有起伏，通气有效 ✓'; Audio.ding(); Vibe.good(); showToast('✅ 第'+ventNum+'次有效通气！','success');
    if (ventNum === 1) { $('#rbStep3').classList.remove('active');$('#rbStep3').classList.add('done');$('#rbStep4').classList.add('active');$('#rbVent2').disabled = false; $('#rbFeedback').innerHTML = '✅ 第1次有效通气完成！<strong>按住第2次通气按钮约1秒</strong>'; }
    else if (ventNum === 2) { $('#rbStep4').classList.remove('active');$('#rbStep4').classList.add('done'); completeRescueBreath(); }
  }
  setTimeout(function() { $('#rbChestIndicator').style.display = 'none'; }, 2000);
}

function completeRescueBreath() {
  state.rescueBreathTrainer.completed = true;
  var score = 0;
  if (state.rescueBreathTrainer.airwayOpened) score += 2;
  if (state.rescueBreathTrainer.nosePinched) score += 2;
  var effectiveCount = state.rescueBreathTrainer.breaths.filter(function(b){return b.effective;}).length;
  score += Math.min(4, effectiveCount * 2);
  if (state.rescueBreathTrainer.overVentilationCount === 0) score += 2;
  state.scores.rescueBreath = Math.min(10, score);
  state.completed[7] = true;
  $('#rbFeedback').innerHTML = '<span style="color:var(--c-success);">✅ 已完成 30:2 一轮CPR！得分：'+state.scores.rescueBreath+'/10</span>';
  $('#kcP7').classList.add('show');
  Audio.ding(); showToast('✅ 人工呼吸完成！', 'success');
}

function stopBreathing() {
  if (rbRaf) { cancelAnimationFrame(rbRaf); rbRaf = null; }
  if (_rbWaveRaf) { cancelAnimationFrame(_rbWaveRaf); _rbWaveRaf = null; }
  if (window._rbBreathNodes) { try { window._rbBreathNodes.forEach(function(n){n.stop();}); } catch(e) {} window._rbBreathNodes = null; }
  rbPressStart = 0; $('#rbChestIndicator').style.display = 'none';
  // Clean up ventilation event listeners
  ['rbVent1','rbVent2'].forEach(function(id) {
    var btn = $('#'+id); if (!btn || !btn._ventCleanup) return;
    btn._ventCleanup(); btn._ventCleanup = null;
  });
}

// // PAGE 8: AED使用
// ==========================================================
function enterPage8() {
  state.aedStep = 0; state.aedPadsPlaced = {};
  var oldPads = $$('.aed-drag-pad');
  if (oldPads && oldPads._dragCleanup) { oldPads._dragCleanup(); oldPads._dragCleanup = null; }
  try { $('#kcP8').classList.remove('show'); } catch(e) {}
  $('#aedPadPlacement').style.display = 'none'; $('#aedAnalyzing').style.display = 'none';
  $('#padPlaceMsg').textContent = '拖动或点击①号到右侧锁骨下方，②号到左侧腋前线';
  $$('.aed-drag-pad').forEach(p => p.classList.remove('placed'));
  $$('.aed-target-zone').forEach(z => z.classList.remove('matched'));
  try { var rr8 = $('#riskReplayP8'); if (rr8) rr8.classList.remove('show'); } catch(e) {}
  // Reset device state
  $('#aedLid').classList.remove('opened');
  $('#aedScreen').classList.remove('on');
  $('#aedPowerBtn').classList.remove('pressed');
  $('#aedPackage').classList.remove('opened');
  $('#aedTearLine').classList.remove('torn');
  stopAedLcd();$('#aedMsg').textContent = '等待开机...';
  $('#aedSub').textContent = '';
  $('#aedPowerBtn').classList.remove('locked'); $('#aedPowerBtn').classList.remove('pressed');
  // Reset step indicators
  ['N1','N2','N3','N4'].forEach(id => $('#aedStep'+id).className = 'aed-step-node');
  // Step 1: Open lid → Power on
  initAedStep1();
}

// ── Step 1: Open AED lid → Press power button ──
var _aedLcdCtx=null,_aedLcdRaf=null,_aedLcdScan=0,_aedLcdWaveType=null,_aedLcdMsgTxt=null,_aedLcdMsgSub=null,_aedLcdMsgBlink=false;function drawAedLcd(){var c=document.getElementById('aedLcdCanvas');if(!c||c.style.display==='none')return;var ctx=c.getContext('2d'),w=c.width=c.offsetWidth*2,h=c.height=c.offsetHeight*2;ctx.setTransform(2,0,0,2,0,0);w=c.offsetWidth;h=c.offsetHeight;ctx.fillStyle='#0a1a0a';ctx.fillRect(0,0,w,h);for(var y=0;y<h;y+=3){ctx.fillStyle='rgba(0,255,0,'+(0.02+Math.sin(y+_aedLcdScan)*0.015)+')';ctx.fillRect(0,y,w,1)}ctx.fillStyle='#0f2';ctx.fillRect(w-28,4,24,8);ctx.fillStyle='#0a1a0a';ctx.fillRect(w-26,5,22,2);ctx.fillRect(w-26,8,18,2);ctx.font='9px monospace';ctx.fillStyle='#0f2';ctx.fillText('████ 100%',w-52,12);ctx.font='7px monospace';ctx.fillStyle='rgba(0,255,0,0.5)';ctx.fillText('AED-2000 v2.4',8,12);if(_aedLcdWaveType){ctx.save();ctx.beginPath();ctx.strokeStyle=_aedLcdWaveType==='vf'?'#f44':'#0f2';ctx.lineWidth=2;for(var x=20;x<w-20;x+=3){var y2=h/2+Math.sin(Date.now()*0.008+x*(_aedLcdWaveType==='vf'?0.15:0.08))*12;if(_aedLcdWaveType==='vf'){y2+=Math.sin(x*0.3)*14+Math.sin(x*0.7)*8}else{y2+=Math.sin(x*0.08)*10+Math.cos(x*0.05)*5}if(x===20)ctx.moveTo(x,y2);else ctx.lineTo(x,y2)}ctx.stroke();ctx.restore()}if(_aedLcdMsgTxt){ctx.save();ctx.font='bold 16px monospace';ctx.fillStyle='#0f2';ctx.textAlign='center';ctx.shadowColor='rgba(0,255,0,0.3)';ctx.shadowBlur=4;ctx.fillText(_aedLcdMsgTxt,w/2,52);if(_aedLcdMsgSub){ctx.font='10px monospace';ctx.fillStyle='rgba(0,255,0,0.7)';ctx.shadowBlur=0;ctx.fillText(_aedLcdMsgSub,w/2,72)}if(_aedLcdMsgBlink&&Math.floor(Date.now()/500)%2){ctx.font='12px monospace';ctx.fillText('▌',w-16,h-12)}ctx.textAlign='start';ctx.restore()}_aedLcdScan+=0.5;_aedLcdRaf=requestAnimationFrame(drawAedLcd)}function startAedLcd(){var c=document.getElementById('aedLcdCanvas');if(!c)return;c.style.display='block';c.style.height='130px';var aedScr=document.getElementById('aedScreen');if(aedScr)aedScr.style.display='none';drawAedLcd()}function stopAedLcd(){if(_aedLcdRaf){cancelAnimationFrame(_aedLcdRaf);_aedLcdRaf=null}var c=document.getElementById('aedLcdCanvas');if(c)c.style.display='none';var aedScr=document.getElementById('aedScreen');if(aedScr)aedScr.style.display='';_aedLcdWaveType=null;_aedLcdMsgTxt=null;_aedLcdMsgSub=null;_aedLcdMsgBlink=false}function aedLcdMsg(txt,sub,blink){_aedLcdMsgTxt=txt;_aedLcdMsgSub=sub||null;_aedLcdMsgBlink=!!blink}function aedLcdWave(type){_aedLcdWaveType=type}
function initAedStep1() {
  $('#aedStepN1').classList.add('active');
  $('#aedPowerBtn').classList.add('locked');
  var lidClicked = false, powerOn = false;

  $('#aedLid').onclick = function() {
    if (lidClicked) return;
    lidClicked = true;
    $('#aedLid').classList.add('opened');
    $('#aedPowerBtn').classList.remove('locked');
    Audio.ding();
    showToast('设备盖已打开，请按绿色电源键开机', 'info');
  };

  $('#aedPowerBtn').onclick = function() {
    if (powerOn) return;
    if (!lidClicked) { showToast('请先打开AED设备盖', 'info'); return; }
    powerOn = true; window._aedPoweredOn = true;
    $('#aedPowerBtn').classList.add('pressed');
    $('#aedScreen').classList.add('on');
    $('#aedMsg').textContent = 'AED 已开机';startAedLcd();aedLcdMsg('AED 已开机','请取电极片',true);
    $('#aedSub').textContent = '请取电极片';
    speakSequence(['已开机！请按照语音提示操作。','将电极片贴在患者裸露的胸部。','一块贴在右锁骨下方。','另一块贴在左腋前线。'], 'aed');
    Audio.ding();
    // Mark step 1 done
    $('#aedStepN1').classList.remove('active'); $('#aedStepN1').classList.add('done');
    state.aedStep = 1;
    state.scores.aed = 5;
    // Short delay then move to step 2
    setTimeout(function() { initAedStep2(); }, 600);
  };
}

// ── Step 2: Tear package → Drag pads ──
function initAedStep2() {
  $('#aedStepN2').classList.add('active');
  var torn = false;

  $('#aedTearLine').onclick = function() {
    if (torn) return;
    torn = true;
    aedLcdMsg('请粘贴电极片','①右锁骨下 ②左腋前线',false);$('#aedTearLine').classList.add('torn');
    $('#aedPackage').classList.add('opened');
    showToast('包装已撕开！请拖动电极片到身体对应位置', 'success');
    speak('一块贴在右锁骨下方，另一块贴在左腋前线。', 'aed');
    Audio.ding();
    // Show pad placement area
    $('#aedPadPlacement').style.display = 'block';
    setTimeout(function() { initAedDrag(); }, 150);
  };
}

// ── Modified initAedDrag: drag on desktop, click-to-place on touch devices ──
function initAedDrag() {
  if (!window._aedPoweredOn) { showToast('请先按下电源键开机', 'info'); return; }
  var pads = $$('.aed-drag-pad');
  var zones = $$('.aed-target-zone');
  pads.forEach(function(pad) {
    pad.classList.remove('placed');
    pad.style.position = ''; pad.style.left = ''; pad.style.top = '';
    pad.style.zIndex = ''; pad.style.margin = '';
    pad.style.pointerEvents = 'auto'; pad.style.touchAction = 'none';
    pad.style.webkitUserSelect = 'none'; pad.style.userSelect = 'none';
  });

  // ── Click-to-place (always enabled) ──
    var selectedPad = null;
    $('#padPlaceMsg').textContent = '拖动电极片到身体对应位置，或点击电极片选中后再点击目标位置';

    pads.forEach(function(pad) {
      pad.style.cursor = 'pointer';
      pad.onclick = function(e) {
        e.preventDefault(); e.stopPropagation();
        if (pad.classList.contains('placed')) return;
        // Deselect previous
        if (selectedPad && selectedPad !== pad) {
          selectedPad.style.outline = '';
          selectedPad.style.transform = '';
        }
        if (selectedPad === pad) {
          // Deselect
          pad.style.outline = '';
          pad.style.transform = '';
          selectedPad = null;
          return;
        }
        // Select this pad
        pad.style.outline = '3px solid #3b82f6';
        pad.style.transform = 'scale(1.08)';
        selectedPad = pad;
      };
    });

    zones.forEach(function(zone) {
      zone.style.cursor = 'pointer';
      zone.onclick = function(e) {
        e.preventDefault(); e.stopPropagation();
        if (!selectedPad) { showToast('请先点击电极片选中', 'info'); return; }
        var padNum = parseInt(selectedPad.dataset.pad);
        var zoneNum = parseInt(zone.dataset.pad);
        if (padNum !== zoneNum) {
          showToast('电极片' + padNum + '应贴到位置' + zoneNum, 'info');
          return;
        }
        if (selectedPad.classList.contains('placed')) return;
        zone.classList.add('matched');
        selectedPad.classList.add('placed');
        selectedPad.style.outline = '';
        selectedPad.style.transform = '';
        state.aedPadsPlaced[padNum] = true;
        Audio.ding();
        $('#padPlaceMsg').textContent = '✅ 电极片' + padNum + '贴放正确！';
        showToast('电极片' + padNum + '贴放正确！', 'success');
        selectedPad = null;
        if (state.aedPadsPlaced[1] && state.aedPadsPlaced[2]) {
          setTimeout(function() { initAedStep3(); }, 500);
        }
      };
    });

    pads._dragCleanup = function() {
      pads.forEach(function(p) { p.onclick = null; });
      zones.forEach(function(z) { z.onclick = null; });
    };

  // ── Drag mode for desktop ──
  var dragPad = null, startX = 0, startY = 0, startLeft = 0, startTop = 0, cloneEl = null;

  function onDown(e) {
    var pad = e.target.closest('.aed-drag-pad');
    if (!pad || pad.classList.contains('placed')) return;
    e.preventDefault(); e.stopPropagation();
    dragPad = pad;
    var rect = pad.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY;
    startLeft = rect.left; startTop = rect.top;
    cloneEl = pad.cloneNode(true);
    cloneEl.style.cssText = 'position:fixed;left:'+rect.left+'px;top:'+rect.top+'px;z-index:999;margin:0;pointer-events:none;width:'+rect.width+'px;opacity:0.9;transform:scale(1.08);box-shadow:0 8px 24px rgba(229,57,53,0.4);';
    document.body.appendChild(cloneEl);
    zones.forEach(function(z) { z.style.borderColor = '#ef5350'; z.style.boxShadow = '0 0 16px rgba(229,57,53,0.3)'; });
  }

  function onMove(e) {
    if (!dragPad || !cloneEl) return;
    e.preventDefault();
    cloneEl.style.left = (startLeft + e.clientX - startX) + 'px';
    cloneEl.style.top = (startTop + e.clientY - startY) + 'px';
  }

  function onUp(e) {
    if (!dragPad || !cloneEl) return;
    var pad = dragPad, padNum = parseInt(pad.dataset.pad);
    var pr = cloneEl.getBoundingClientRect();
    var pcx = pr.left + pr.width/2, pcy = pr.top + pr.height/2;
    var matched = false;
    zones.forEach(function(zone) {
      var zr = zone.getBoundingClientRect();
      if (pcx > zr.left && pcx < zr.right && pcy > zr.top && pcy < zr.bottom && parseInt(zone.dataset.pad) === padNum) {
        matched = true;
        zone.classList.add('matched');
        pad.classList.add('placed');
        state.aedPadsPlaced[padNum] = true;
        Audio.ding();
        $('#padPlaceMsg').textContent = '✅ 电极片' + padNum + '贴放正确！';
        showToast('电极片' + padNum + '贴放正确！', 'success');
      }
    });
    if (!matched) showToast('请拖到正确位置', 'info');
    cloneEl.remove(); cloneEl = null;
    zones.forEach(function(z) { z.style.borderColor = ''; z.style.boxShadow = ''; });
    dragPad = null;
    // Check if both pads placed → go to step 3
    if (state.aedPadsPlaced[1] && state.aedPadsPlaced[2]) {
      setTimeout(function() { initAedStep3(); }, 500);
    }
  }

  document.addEventListener('pointerdown', onDown);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  pads._dragCleanup = function() {
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (cloneEl) { cloneEl.remove(); cloneEl = null; }
  };
}

// ── Step 3: Analyze rhythm ──
function initAedStep3() {
  var pads3 = $$('.aed-drag-pad');
  if (pads3 && pads3._dragCleanup) { pads3._dragCleanup(); pads3._dragCleanup = null; }
  $('#aedPadPlacement').style.display = 'none';
  $('#aedStepN2').classList.remove('active'); $('#aedStepN2').classList.add('done');
  $('#aedStepN3').classList.add('active');
  state.aedStep = 3; state.scores.aed = 15;

  $('#aedMsg').textContent = '准备分析心律';
  $('#aedSub').textContent = '请先确认安全 ⚠️';
  speak('分析心律前，请确认所有人离开患者！', 'urgent');
  showToast('⚠️ 分析心律前必须确认所有人远离患者', 'info');

  // Force safety confirmation before analysis
  showSafetyConfirm('电极片已贴好。<br><br><b>请大声喊出"所有人离开患者！"</b><br><br>确认无人接触患者后才能开始分析心律。<br>真实急救中，分析心律时需保持患者静止。', function() {
    $('#aedMsg').textContent = '正在分析心律...';
    $('#aedSub').textContent = '请勿触摸患者';
    speak('分析心律！请勿触摸患者！', 'urgent');

    aedLcdWave('vf');aedLcdMsg('⚠ 分析中','心率 280 BPM · 请勿接触',true);$('#aedAnalyzing').style.display = 'block';
    var t = 5;
    $('#aedAnalyzeTimer').textContent = '5';
    var iv = setInterval(function() {
      t--;
      $('#aedAnalyzeTimer').textContent = t;
      if (t <= 0) {
        clearInterval(iv);
        $('#aedAnalyzing').style.display = 'none';
        initAedStep4();
      }
    }, 1000);
  });
}

// ── Step 4: Shock ──
function initAedStep4() {
  $('#aedStepN3').classList.remove('active'); $('#aedStepN3').classList.add('done');
  $('#aedStepN4').classList.add('active');
  state.aedStep = 4;

  $('#aedMsg').textContent = '建议电击';
  $('#aedSub').textContent = '按下电击按钮前请确认安全 ⚡';
  speakSequence(['建议电击！','按下电击按钮前确认所有人离开！'], 'urgent');

  // Add a shock button dynamically
  var existing = $('#aedShockBtn');
  if (!existing) {
    var btn = document.createElement('button');
    btn.id = 'aedShockBtn';
    btn.className = 'btn btn--primary btn--lg btn--block';
    btn.style.cssText = 'margin-top:8px;background:linear-gradient(135deg,#ff5252,#b71c1c);font-size:1.1rem;';
    btn.textContent = '⚡ 按下电击按钮';
    btn.onclick = function() {
      // Force safety confirmation before shock
      showSafetyConfirm('<b>即将放电！</b><br><br>请大声喊出<b>"闪开！所有人离开！"</b><br><br>视觉确认<b>无人接触患者</b>后才能按下电击按钮。<br>真实急救中，AED电击前必须确保旁观者安全。', function() {
        btn.remove();
        // 电容充电音效
        $('#aedMsg').textContent = '充电中...';
        $('#aedSub').textContent = '';
        if (Audio.ctx) {
          var capOsc = Audio.ctx.createOscillator(); var capGain = Audio.ctx.createGain();
          capOsc.type = 'sawtooth'; capOsc.frequency.setValueAtTime(200, Audio.ctx.currentTime);
          capOsc.frequency.linearRampToValueAtTime(1200, Audio.ctx.currentTime + 0.8);
          capGain.gain.setValueAtTime(0.04, Audio.ctx.currentTime); capGain.gain.linearRampToValueAtTime(0.08, Audio.ctx.currentTime + 0.6);
          capGain.gain.setValueAtTime(0, Audio.ctx.currentTime + 0.9);
          capOsc.connect(capGain); capGain.connect(Audio.ctx.destination); capOsc.start(); capOsc.stop(Audio.ctx.currentTime + 0.9);
        }
        setTimeout(function() {
          $('#aedMsg').textContent = '放电中...';
          $('#aedSub').textContent = '';
          document.getElementById('app-container').classList.add('aed-shock-flash');
          setTimeout(function() { document.getElementById('app-container').classList.remove('aed-shock-flash'); }, 100);
          Audio.shock(); Vibe.vibrate(200);
          setTimeout(function() {
            $('#aedMsg').textContent = '电击完成';
            $('#aedSub').textContent = '继续CPR';
            $('#aedStepN4').classList.remove('active'); aedLcdWave('normal');aedLcdMsg('✅ 电击已执行','立即开始CPR',false);$('#aedStepN4').classList.add('done');
            $('#kcP8').classList.add('show');
            speak('电击已完成。请立即开始胸外按压。', 'aed');
            Audio.ding();
            showToast('✅ AED 操作完成 +20分', 'success');
            state.scores.aed = 20;
            state.aedStep = 4; state.completed[8] = true;
          }, 500);
        }, 900);
      });
    };
    $('#aedDevice').after(btn);
  }
}

// ==========================================================
// PAGE 9: 循环管理
function continueToNextRound() {
  state.cycleRound = (state.cycleRound || 0) + 1;
  showToast('第 ' + state.cycleRound + ' 轮 30:2 循环开始', 'info');
  goToPage(6, { force: true });
}
function enterPage9() {
  if (!state.sortRetry) { state.cycleCount++; }
  state.sortRetry = false;
  try { $('#kcP9').classList.remove('show'); } catch(e) {}
  $('#cycleCircle').textContent = state.cycleCount + ' 轮';
  $('#cycleCompleted').textContent = state.cycleCount;
  $('#cycleBarFill').style.transform = 'scaleX(' + (Math.min(100, state.cycleCount * 20) / 100) + ')';
  $('#fatigueWarn').classList.remove('show');
  $('#cycleDoneBtn').style.display = 'none';
  if (state.cycleRound > 0 && state.cycleRound % 3 === 2 && state._lastModalRound !== state.cycleRound) {
    state._lastModalRound = state.cycleRound;
    showModal({ type: 'confirm', title: '👨‍⚕️ 是否学会？', text: '已完成<strong>第' + state.cycleRound + '轮</strong>（考核轮）。<br>你觉得掌握了吗？<br><span style="font-size:0.7rem;color:var(--c-text-muted);">选"再练一轮"将重新开启教练模式</span>', confirmText: '✅ 学会了！进入考核', cancelText: '🔄 再练一轮（开启教练）', onConfirm: function() { showSortingQuiz(); }, onCancel: function() { showToast('回到教练模式练习！加油💪', 'info'); state.sortRetry = true; continueToNextRound(); } });
    return;
  }
  if (state.cycleCount >= 4) { $('#fatigueWarn').classList.add('show'); }
  if (state.cycleCount >= 5) {
    $('#cycleContinueBtn').style.display = 'none'; $('#cycleDoneBtn').style.display = 'block';
    $('#cycleDoneBtn').onclick = function() { state.scores.cycle = 10; state.completed[9] = true; Timer.stop(); goToPage(10); };
  } else if (state.cycleCount >= 3 && state._lastModalRound) {
    $('#cycleContinueBtn').style.display = 'block'; $('#cycleContinueBtn').textContent = '继续下一轮按压';
    $('#cycleDoneBtn').style.display = 'block';
    $('#cycleDoneBtn').onclick = function() { state.scores.cycle = Math.min(10, state.cycleCount * 2); state.completed[9] = true; Timer.stop(); goToPage(10); };
    $('#cycleContinueBtn').onclick = continueToNextRound;
  } else {
    $('#cycleContinueBtn').style.display = 'block'; $('#cycleContinueBtn').textContent = '继续下一轮按压';
    $('#cycleDoneBtn').style.display = 'none';
    $('#cycleContinueBtn').onclick = continueToNextRound;
  }
  // Cycle decision card handlers
  (function() {
    function setDecision(msg, cls) {
      var fb = $('#cycleDecisionFeedback'); if (fb) { fb.textContent = msg; fb.style.color = cls === 'ok' ? 'var(--c-success)' : cls === 'warn' ? 'var(--c-warning)' : 'var(--c-danger)'; }
    }
    var btnCPR = $('#cycleDecisionCPR');
    var btnCheck = $('#cycleDecisionCheck');
    var btnStop = $('#cycleDecisionStop');
    if (btnCPR) btnCPR.onclick = function() {
      setDecision('✅ 判断正确！无反应则继续CPR——AHA指南：除非患者出现明显生命迹象或专业急救人员接手，否则不应中断CPR', 'ok');
      state.scores.cycle = Math.min(10, (state.scores.cycle || 0) + 1);
    };
    if (btnCheck) btnCheck.onclick = function() {
      setDecision('⚠️ 可快速检查（不超过10秒）。注意：不确定时也应继续CPR——宁可多做一轮，不可错过抢救时机', 'warn');
    };
    if (btnStop) btnStop.onclick = function() {
      setDecision('❌ 危险！无反应患者不能停止CPR——停止CPR每分钟存活率显著下降。除非患者恢复意识或EMS接手，否则绝不放弃', 'bad');
      pushRisk({type:'cycle', action:'在无生命迹象时停止了CPR', risk:'脑缺氧加重，存活率急剧下降', correct:'持续CPR直到：①患者出现生命迹象 ②专业急救人员接手 ③AED提示分析心律', knowledge:'cycle', tip:'AHA强调：持续不间断CPR是决定存活预后的关键因素之一'});
      showRiskReplay(9, state.riskEvents[state.riskEvents.length-1]);
    };
  })();
}

// // PAGE 10: 结局判定
// ==========================================================
function enterPage10(opts = {}) {
  // Calculate final score
  const total = state.scores.env + state.scores.call + state.scores.breathCheck +
                state.scores.compression + state.scores.rescueBreath +
                state.scores.aed + state.scores.cycle;
  // Time bonus: 6min = full 10pts, -2 per extra minute
  const overMin = Math.max(0, Math.floor((state.totalTime - 360) / 60));
  state.scores.timeBonus = Math.max(0, 10 - overMin * 2);
  const finalScore = total + state.scores.timeBonus;
  const isFailure = finalScore < 60;

  Storage.setBestScore(finalScore);

  const icon = $('#outcomeIcon');
  const title = $('#outcomeTitle');
  const detail = $('#outcomeDetail');

  if (isFailure) {
    icon.textContent = '💔';
    title.textContent = '训练未通过';
    title.style.color = 'var(--c-danger)';
    detail.innerHTML = `总得分：<strong>${finalScore}</strong> / 100<br>
      用时：${formatTime(state.totalTime)}<br>
      <span class="text-danger">得分不足60分，建议重新训练。</span><br>
      <span class="text-muted">急救技能需要反复练习，建议重新学习。</span>`;
    Audio.flatline();
  } else {
    icon.textContent = '❤️';
    title.textContent = '训练完成！';
    title.style.color = 'var(--c-success)';
    detail.innerHTML = `总得分：<strong>${finalScore}</strong> / 100<br>
      用时：${formatTime(state.totalTime)}<br>
      <span class="text-success">你完成了较规范的急救流程，为专业救援争取了时间</span>`;
    Audio.cheer();
    // Particle celebration
    startParticles();
  }
  // Always show report button regardless of score
  $('#outcomeReportBtn').style.display = 'inline-block';

  $('#outcomeReportBtn').onclick = () => {
    stopParticles();
    state.completed[10] = true;
    goToPage(11);
  };
  $('#outcomeRetryBtn').onclick = () => { resetAll(); };
}

// ==========================================================
// PAGE 11: 智能训练报告
// ==========================================================
function enterPage11() {
  const total = state.scores.env + state.scores.call + state.scores.breathCheck +
                state.scores.compression + state.scores.rescueBreath +
                state.scores.aed + state.scores.cycle + state.scores.timeBonus;
  $('#reportTotalScore').textContent = total;

  let gradeText, gradeClass;
  if (total >= 90) { gradeText = '🏆 优秀急救员'; gradeClass = 'excellent'; }
  else if (total >= 70) { gradeText = '👍 良好，继续加油'; gradeClass = 'good'; }
  else { gradeText = '📚 需要重新学习'; gradeClass = 'poor'; }
  const grade = $('#reportGrade');
  grade.textContent = gradeText; grade.className = 'alphabetical-rating-badge report-grade ' + gradeClass;

  // Fill SVG score ring
  const ringFill = $('#scoreRingFill');
  if (ringFill) {
    const circumference = 377; // 2*PI*60 ≈ 377
    const offset = circumference - (total / 100) * circumference;
    ringFill.setAttribute('stroke-dashoffset', offset);
  }

  // Fill bar charts — 6 dimensions with rating labels
  var s = state.scores;
  function setBar(id, val, maxVal) {
    var safeVal = Number.isFinite(val) ? Math.round(val) : 0;
    $('#'+id).textContent = safeVal + '%（' + maxVal + '分满分）';
    $('#'+id.replace('Val','Fill')).style.transform = 'scaleX(' + (safeVal/100) + ')';
    // Rating label
    var ratingId = id.replace('Val','Rating');
    var el = $('#'+ratingId);
    if (el) {
      if (safeVal >= 90) { el.textContent = '优秀'; el.className = 'bar-rating rating-excellent'; }
      else if (safeVal >= 70) { el.textContent = '达标'; el.className = 'bar-rating rating-good'; }
      else if (safeVal >= 40) { el.textContent = '需加强'; el.className = 'bar-rating rating-warn'; }
      else { el.textContent = '高风险'; el.className = 'bar-rating rating-bad'; }
    }
  }
  function pct(score, max) { var s = Number(score) || 0; var m = Number(max) || 1; return Math.min(100, Math.max(0, Math.round(s / m * 100))); }
  setBar('barValSafety',     pct(s.env, 5));
  setBar('barValCall',       pct(s.call, 10));
  setBar('barValBreathCheck', pct(s.breathCheck, 5));
  setBar('barValCompress',   pct(s.compression, 30));
  setBar('barValBreath',     pct(s.rescueBreath, 10));
  setBar('barValAed',        pct(s.aed, 20));
  // ─── Deduction reasons (show why each dimension lost points) ───
  function showReason(id, text) { var el=$('#'+id); if(el&&text){el.textContent=text;el.style.display='block';} else if(el){el.style.display='none';} }
  // Safety
  var safetyPct = pct(s.env, 5);
  if (safetyPct < 80) {
    showReason('reasonSafety', '扣分原因：环境安全判断未通过——急救首要原则是确保施救者自身安全，必须先观察现场有无危险再接近患者');
  }
  // Call
  var callPct = pct(s.call, 10);
  if (callPct < 80) { showReason('reasonCall', '扣分原因：呼救信息不完整——需清晰说出地点、患者状态、所需帮助'); }
  // Breath check
  var bcPct = pct(s.breathCheck, 5);
  if (bcPct < 80) {
    var bcReasons = []; var bt = state.breathCheckTrainer || {};
    if (!bt.tapShoulder) bcReasons.push('未轻拍双肩检查反应');
    if (!bt.shout) bcReasons.push('未大声呼喊确认意识');
    if (!bt.observeStarted) bcReasons.push('未观察胸廓起伏');
    if (bt.selectedResult && bt.selectedResult !== 'noBreath') bcReasons.push('判断结果错误');
    showReason('reasonBreathCheck', '扣分原因：' + (bcReasons.length > 0 ? bcReasons.join('；') : '反应呼吸判断不完整'));
  }
  // Compression
  var compPct = pct(s.compression, 30);
  if (compPct < 80) {
    var compReasons = []; var cd2 = state.compressionData || {};
    if (cd2.totalPresses === 0) compReasons.push('未进行胸外按压');
    else {
      if (cd2.depthGoodRate < 0.7) compReasons.push((cd2.depthOkCount||0) + '/' + (cd2.totalPresses||0) + '次按压深度不达标(<5cm或>6cm)');
      if (cd2.rateGoodRate < 0.7) compReasons.push((cd2.rateOkCount||0) + '/' + (cd2.totalPresses||0) + '次按压频率不合格(<100或>120 BPM)');
      if ((cd2.reboundViolations||0) > 2) compReasons.push(cd2.reboundViolations + '次回弹不充分');
      if ((cd2.interruptionCount||0) > 2) compReasons.push(cd2.interruptionCount + '次按压中断过长');
    }
    showReason('reasonCompress', '扣分原因：' + (compReasons.length > 0 ? compReasons.join('；') : '按压质量综合评分不足'));
  }
  // Rescue breath
  var rbPct = pct(s.rescueBreath, 10);
  if (rbPct < 80) {
    var rbReasons = []; var rbt = state.rescueBreathTrainer || {};
    if (!rbt.airwayOpened) rbReasons.push('未开放气道（仰头抬颏）');
    if (!rbt.nosePinched) rbReasons.push('未捏住鼻翼');
    var effCount = (rbt.breaths || []).filter(function(b){return b.effective;}).length;
    if (effCount < 2) rbReasons.push('有效通气不足(' + effCount + '/2次)');
    if ((rbt.overVentilationCount||0) > 0) rbReasons.push(rbt.overVentilationCount + '次过度通气（可能致胃胀气）');
    showReason('reasonBreath', '扣分原因：' + (rbReasons.length > 0 ? rbReasons.join('；') : '人工通气步骤不完整'));
  }
  // AED
  var aedPct = pct(s.aed, 20);
  if (aedPct < 80) {
    var aedReasons = []; var aedStep = state.aedStep || 0;
    if (aedStep < 1) aedReasons.push('未开盖/开机');
    if (aedStep < 2) aedReasons.push('未撕开电极片包装并贴片');
    if (aedStep < 3) aedReasons.push('未完成心律分析');
    if (aedStep < 4) aedReasons.push('未执行电击放电');
    showReason('reasonAed', '扣分原因：' + (aedReasons.length > 0 ? aedReasons.join('；') : 'AED操作步骤不完整'));
  }
  // Populate training metrics card
  var cd = state.compressionData;
  $('#reportTrainTime').textContent = formatTime(state.totalTime);
  $('#reportPressCount').textContent = (cd.totalPresses || 0) + ' 次';
  $('#reportInterruptTime').textContent = Math.round((cd.totalInterruptionTime || 0) / 1000) + ' 秒';
  $('#reportAvgDepth').textContent = (cd.avgDepth || 0).toFixed(1) + ' cm';
  $('#reportAvgBpm').textContent = (cd.avgBpm || '--') + ' BPM';

  // Fill performance tags
  const goodTags = [], riskTags = [];
  if (state.scores.env >= 5) goodTags.push('✅ 环境安全判断正确');
  else if (state.completed[3]) riskTags.push('⚠️ 环境评估需加强');
  if (state.scores.breathCheck >= 5) goodTags.push('✅ 反应判断准确'); else if (state.completed[5]) riskTags.push('⚠️ 反应判断需加强');
  if (state.scores.compression >= 20) goodTags.push('✅ 按压质量优秀');
  else if (state.scores.compression >= 10) goodTags.push('✅ 按压基本达标');
  else riskTags.push('⚠️ 按压需要练习');
  if (state.scores.rescueBreath >= 10) goodTags.push('✅ 人工通气规范'); else if (state.completed[7]) riskTags.push('⚠️ 人工呼吸需练习');
  if (state.scores.aed >= 20) goodTags.push('✅ AED操作完整');
  else if (state.completed[8]) riskTags.push('⚠️ AED步骤有遗漏');
  if (state.scores.timeBonus >= 8) goodTags.push('⏱ 黄金时间内完成');
  else if (state.totalTime > 360) riskTags.push('⚠️ 用时偏长，需提速');
  if (goodTags.length === 0) goodTags.push('📋 继续加油');
  $('#reportGood').innerHTML = goodTags.map(function(t) { return '<span class="fluid-tag-pill-node tag--positive">' + t + '</span>'; }).join('');
  $('#reportRisks').innerHTML = riskTags.map(function(t) { return '<span class="fluid-tag-pill-node tag--negative">' + t + '</span>'; }).join('');

  // AI advice
  let advice = '';
  if (state.compressionData.avgBpm > 0) { if (state.compressionData.avgBpm < 100) advice += '• 按压频率偏慢('+state.compressionData.avgBpm+'BPM)，建议保持在 100-120 次/分钟。跟着节拍器练习。\n'; else if (state.compressionData.avgBpm > 120) advice += '• 按压频率偏快('+state.compressionData.avgBpm+'BPM)，放慢节奏，确保每次按压充分回弹。\n'; else advice += '• 按压频率控制得很好('+state.compressionData.avgBpm+'BPM)！\n'; }
  if (state.compressionData.totalPresses > 0) { if (state.compressionData.depthGoodRate < 0.7) advice += '• 深度达标率不足('+Math.round(state.compressionData.depthGoodRate*100)+'%)，注意按压深度要达到 5-6cm。\n'; else advice += '• 按压深度达标率优秀('+Math.round(state.compressionData.depthGoodRate*100)+'%)！\n'; }
  if (state.compressionData.reboundViolations > 2) advice += '• 回弹不充分次数较多('+state.compressionData.reboundViolations+'次)。\n';
  if (state.scores.breathCheck < 5) advice += '• 反应与呼吸判断需要加强——轻拍双肩+大声呼喊+20秒内观察呼吸。\n'; else advice += '• 反应与呼吸判断满分！快速准确地完成了患者评估。\n';
  if (state.scores.rescueBreath < 10) { if (state.rescueBreathTrainer && state.rescueBreathTrainer.overVentilationCount > 0) advice += '• 人工呼吸有'+state.rescueBreathTrainer.overVentilationCount+'次过度通气，吹气约1秒见胸廓起伏即可。\n'; else if (!state.rescueBreathTrainer || !state.rescueBreathTrainer.airwayOpened) advice += '• 人工呼吸需确保先开放气道（仰头抬颏），再捏鼻吹气。\n'; else advice += '• 人工呼吸可继续练习，确保每次有效通气。\n'; } else advice += '• 人工呼吸满分！气道开放+有效通气执行规范。\n';
  if (state.scores.aed < 20) advice += '• AED 操作需要熟练，记住口诀："开机 → 贴片 → 分析 → 电击"。\n';
  if (!advice) advice = '• 你的急救操作非常出色！各维度均表现优秀，继续保持！\n';
  const reportReview = $('#reportReview');
  if (reportReview) { reportReview.innerHTML = '<p style="font-weight:700;font-size:0.78rem;color:var(--c-primary);margin-bottom:6px;">📋 下次敢救，可以先做好这几步</p><p style="margin-bottom:8px;">' + advice.trim().replace(/\n/g, '<br>') + '</p>'; }

  // ─── 风险回放列表 ───
  var riskEvents = state.riskEvents || [];
  var replayCard = $('#reportRiskReplayCard');
  var replayContainer = $('#reportRiskReplay');
  var replayMore = $('#reportRiskMore');
  if (riskEvents.length === 0) {
    replayContainer.innerHTML = '<p style="font-size:0.8rem;color:var(--c-success);line-height:1.6;">✅ 本次训练未记录明显风险操作，建议定期复习 CPR 与 AED 核心步骤。</p>';
    if (replayCard) replayCard.style.display = 'block';
  } else {
    if (replayCard) replayCard.style.display = 'block';
    var MAX = 3;
    var html = '';
    for (var i = 0; i < Math.min(riskEvents.length, MAX); i++) {
      var r = riskEvents[i];
      html += '<div style="background:var(--soft-red);border-radius:var(--radius-xs);padding:10px;margin-bottom:8px;font-size:0.78rem;line-height:1.5;position:relative;">';
      html += '<div style="font-weight:800;color:var(--c-danger);margin-bottom:6px;">⚠️ ' + (r.type||'') + ' 风险事件</div>';
      html += '<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:3px;"><span style="background:#fee2e2;color:#dc2626;padding:1px 6px;border-radius:4px;font-size:0.6rem;font-weight:700;flex-shrink:0;">错误行为</span><span>' + (r.action||'') + '</span></div>';
      html += '<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:3px;"><span style="background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:4px;font-size:0.6rem;font-weight:700;flex-shrink:0;">风险后果</span><span>' + (r.risk||'') + '</span></div>';
      html += '<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:3px;"><span style="background:#d1fae5;color:#059669;padding:1px 6px;border-radius:4px;font-size:0.6rem;font-weight:700;flex-shrink:0;">正确做法</span><span>' + (r.correct||'') + '</span></div>';
      if (r.knowledge) html += '<div style="display:flex;align-items:flex-start;gap:6px;margin-top:4px;padding-top:4px;border-top:1px dashed rgba(220,38,38,0.15);"><span style="background:#dbeafe;color:#2563eb;padding:1px 6px;border-radius:4px;font-size:0.6rem;font-weight:700;flex-shrink:0;">推荐复习</span><a href="javascript:void(0)" onclick="window._scrollToKnowledge(\'' + (r.knowledge||'') + '\')" style="color:var(--c-secondary);font-weight:700;font-size:0.72rem;">📖 查看知识卡</a>';
      if (r.tip) html += ' <span style="font-size:0.65rem;color:var(--c-text-light);">' + r.tip + '</span>';
      html += '</div>';
      html += '</div>';
    }
    replayContainer.innerHTML = html;
    if (riskEvents.length > MAX) {
      replayMore.style.display = 'block';
      replayMore.textContent = '还有 ' + (riskEvents.length - MAX) + ' 条风险操作，请查看知识库复习对应内容';
    }
    if (replayMore) replayMore.style.display = riskEvents.length > MAX ? 'block' : 'none';
  }

  // ─── 急救决策树 ───
  var treeNodes = [
    {id:'safety',label:'现场安全',type:'safety'},
    {id:'call',label:'呼救120',type:'call'},
    {id:'breathing',label:'判断呼吸',type:'breathing'},
    {id:'compression',label:'CPR 按压',type:'compression'},
    {id:'aed',label:'AED 除颤',type:'aed'},
    {id:'cycle',label:'循环坚持',type:'cycle'}
  ];
  var riskTypes = {};
  riskEvents.forEach(function(r){ riskTypes[r.type||''] = true; });
  var treeHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">';
  treeNodes.forEach(function(node, idx){
    var cls = 'risk';
    var badge = '';
    if (riskTypes[node.type]) { cls = 'risk'; badge = '⚠️'; }
    else {
      // crude completion check
      var done = false;
      if (node.type==='safety' && state.scores.env>=5) done=true;
      if (node.type==='call' && state.scores.call>=7) done=true;
      if (node.type==='breathing' && state.scores.breathCheck>=5) done=true;
      if (node.type==='compression' && state.scores.compression>=15) done=true;
      if (node.type==='aed' && state.scores.aed>=10) done=true;
      if (node.type==='cycle' && state.scores.cycle>=10) done=true;
      cls = done ? 'done' : 'pending';
      badge = done ? '✅' : '⬜';
    }
    var bg = cls==='risk'?'var(--soft-red)':cls==='done'?'var(--soft-green)':'#f1f5f9';
    var border = cls==='risk'?'var(--c-danger)':cls==='done'?'var(--c-success)':'var(--rule)';
    var color = cls==='risk'?'var(--c-danger)':cls==='done'?'var(--c-success)':'var(--c-text-light)';
    treeHtml += '<div style="background:'+bg+';border:1px solid '+border+';border-radius:var(--radius-sm);padding:8px 12px;text-align:center;font-size:0.75rem;font-weight:700;color:'+color+';min-width:70px;">'+badge+' '+node.label+'</div>';
    if (idx < treeNodes.length-1) treeHtml += '<span style="display:flex;align-items:center;color:var(--c-text-light);">→</span>';
  });
  treeHtml += '</div>';
  var treeContainer = $('#reportDecisionTree');
  if (treeContainer) treeContainer.innerHTML = treeHtml;

  // ─── 个性化复习建议 ───
  var priorities = [];
  var recMap = {safety:'触电现场处置 / 现场安全',call:'正确拨打120',breathing:'判断反应与呼吸',compression:'高质量CPR',aed:'AED安全使用',cycle:'循环坚持与等待专业救援'};
  Object.keys(riskTypes).forEach(function(t){
    if (recMap[t]) priorities.push({type:t, label:recMap[t]});
  });
  var recHtml = '';
  if (priorities.length === 0) {
    recHtml = '<p style="font-size:0.82rem;color:var(--c-text-secondary);line-height:1.6;">建议定期复习 CPR 与 AED 核心步骤，保持对关键流程的熟悉。</p>';
  } else {
    recHtml = '<div style="display:flex;flex-direction:column;gap:8px;">';
    priorities.forEach(function(p){
      recHtml += '<div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border-radius:var(--radius-xs);padding:10px 12px;font-size:0.78rem;">';
      recHtml += '<span style="font-weight:700;color:var(--c-text);">📌 优先复习：' + p.label + '</span>';
      recHtml += '<button class="btn btn--secondary btn--sm" onclick="window._scrollToKnowledge(\'' + p.type + '\')" style="font-size:0.7rem;min-height:32px;padding:4px 10px;">查看</button>';
      recHtml += '</div>';
    });
    recHtml += '</div>';
  }
  if (reportReview) reportReview.innerHTML += '<hr style="border:none;border-top:1px dashed #CBD5E0;margin:12px 0;">' + recHtml;

  // ─── 训练总结 ───
  var summary = '';
  if (total >= 90) summary = '🏆 优秀：你展现了扎实的急救技能，各环节操作规范，决策判断准确。建议保持定期复训以维持技能熟练度。';
  else if (total >= 70) summary = '👍 良好：整体急救流程较为完整，主要环节操作达标。建议针对薄弱维度加强练习，向优秀水平迈进。';
  else if (total >= 50) summary = '📚 需加强：基本急救流程已掌握，但部分关键环节存在不规范操作。建议重点复习风险回放中的错误项，重新练习。';
  else summary = '🔄 建议重新训练：急救技能需要反复练习才能形成肌肉记忆，每次训练你都在进步。请根据六维分析和风险回放逐一改进，再次尝试。';
  if (state.riskEvents && state.riskEvents.length > 0) summary += ' 本次训练中记录到 ' + state.riskEvents.length + ' 项风险操作，请在"改进建议"中查看详情。';
  else summary += ' 本次训练未记录明显高风险操作，请继续保持规范流程。';
  var summaryEl = $('#reportSummary');
  if (summaryEl) summaryEl.textContent = summary;

  $('#reportNextBtn').onclick = () => { state.completed[11] = true; goToPage(12); };
  $('#reportRetryBtn').onclick = () => { resetAll(); };
}

// ==========================================================
// PAGE 12: 知识库与证书
// ==========================================================
function enterPage12() {
  buildKnowledgeBase();
  // 滚动到顶部
  var page12 = $('.page[data-page="12"]');
  if (page12) page12.scrollTop = 0;
  window.scrollTo(0, 0);
  $('#certPreview').style.display = 'none';
  try { $('#certNameInput').value = localStorage.getItem('cprCertName') || ''; } catch(e) { $('#certNameInput').value = ''; }
  $('#restartBtn').onclick = () => resetAll();
  $('#certGenBtn').onclick = () => {
    const name = $('#certNameInput').value.trim() || '无名英雄';
    $('#certNameDisplay').textContent = name;
    try { localStorage.setItem('cprCertName', name); } catch(e) {}
    const total = state.scores.env + state.scores.call + state.scores.breathCheck +
                  state.scores.compression + state.scores.rescueBreath +
                  state.scores.aed + state.scores.cycle + state.scores.timeBonus;
    $('#certScoreDisplay').textContent = total;
    $('#certPreview').style.display = 'block';
    showToast('证书已生成，请截图保存 📸', 'success');
    // Auto-trigger screenshot download using Canvas
    setTimeout(() => {
      const certEl = $('#certPreview');
      if (!certEl || certEl.style.display === 'none') return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 600 * (window.devicePixelRatio || 1); canvas.height = 400 * (window.devicePixelRatio || 1);
        const ctx = canvas.getContext('2d');
        ctx.scale((window.devicePixelRatio || 1), (window.devicePixelRatio || 1));
        ctx.fillStyle = '#FFFDF5'; ctx.fillRect(0, 0, 600, 400);
        ctx.strokeStyle = '#D4A853'; ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, 580, 380);
        ctx.fillStyle = '#8B6914'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('敢救 · 训练证书', 300, 80);
        ctx.fillStyle = '#5C4A0E'; ctx.font = 'bold 36px sans-serif';
        ctx.fillText(name, 300, 170);
        ctx.fillStyle = '#8B6914'; ctx.font = '18px sans-serif';
        ctx.fillText('已通过心肺复苏情景模拟训练', 300, 230);
        ctx.font = '14px sans-serif';
        ctx.fillText('颁发日期：' + new Date().toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric'}), 300, 355);
        const totalScore = state.scores.env + state.scores.call + state.scores.breathCheck +
          state.scores.compression + state.scores.rescueBreath + state.scores.aed + state.scores.cycle + state.scores.timeBonus;
        ctx.fillText('成绩：' + totalScore + ' 分', 300, 270);
        ctx.fillText('训练用时：' + formatTime(state.totalTime), 300, 310);
        const link = document.createElement('a');
        link.download = '敢救证书_' + name + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('证书图片已下载！', 'success');
      } catch(e) { /* Screenshot skipped */; }
    }, 500);
  };
}

function buildKnowledgeBase() {
  const items = [
    { icon: '🫀', title: '高质量 CPR 标准', summary: '按压深度5-6厘米，频率100-120次/分，保证完全回弹...', body: '按压位置为两乳头连线中点（胸骨下半段）；频率 100-120 次/分；下压深度 5-6 厘米；必须保证每次按压后胸廓完全回弹。中断时间不超过10秒。<br><br>📺 <a href="https://search.bilibili.com/all?keyword=CPR心肺复苏操作教学" target="_blank" rel="noopener" style="color:var(--c-secondary);font-weight:700;">观看CPR操作教学视频 →</a>', knowledge: 'cpr' },
    { icon: '⚡', title: 'AED 详细步骤', summary: '开机→贴电极片→分析心律→电击的四步流程详解', body: '第一步：开机——打开AED电源开关，按语音提示操作。\n第二步：贴电极片——成人电极片一块贴于右锁骨下（右上胸），另一块贴于左腋前线（左侧乳头外侧）。\n第三步：分析心律——机器自动分析，此时确保无人接触患者。\n第四步：电击——确认所有人离开患者后，按下电击按钮。电击后立即恢复CPR，从胸外按压开始。<br><br>📺 <a href="https://search.bilibili.com/all?keyword=AED自动体外除颤器使用教学" target="_blank" rel="noopener" style="color:var(--c-secondary);font-weight:700;">观看AED使用教学视频 →</a>', knowledge: 'aed' },
    { icon: '🫁', title: '气道梗阻急救', summary: '海姆立克法适应症、成人/孕妇/婴儿的操作差异', body: '适应症：当患者无法说话、剧烈咳嗽无声、双手抓住喉咙时，应立即施救。\n\n成人：站在患者背后，一手握拳（拇指侧抵住肚脐上方两横指处），另一手包住拳头，向内上方快速冲击。\n\n孕妇及肥胖者：改为胸部冲击（双手放在胸骨中下段），避免压迫腹部。\n\n婴儿（<1岁）：采取\"5次背部拍击+5次胸部冲击\"交替法。', knowledge: 'choke' },
    { icon: '🩹', title: '创伤急救基础', summary: 'DRABC评估法、直接压迫止血、包扎固定、安全搬运', body: 'DRABC评估法：D（Danger）先确认安全→R（Response）拍肩呼唤→A（Airway）开放气道→B（Breathing）观察呼吸→C（Circulation）检查脉搏和出血。\n\n直接压迫止血：用干净纱布或布料直接压迫出血部位，持续施压。\n\n包扎固定：用绷带或三角巾固定敷料。怀疑骨折时，固定范围应超过骨折部位上下两个关节。\n\n安全搬运：除非现场不安全，不要随意移动伤者。搬运时保持头颈与躯干成一条直线。', knowledge: 'trauma' },
    { icon: '📍', title: '按压位置与深度', summary: '胸骨中下段，成人约5-6cm，100-120次/分钟', body: '按压位置：两乳头连线中点（胸骨中下段）。深度：5-6cm（成人，参考AHA指南建议范围）。频率：100-120次/分钟。按压时手臂伸直，用身体重量而非手臂力量。每次按压后让胸廓完全回弹。' },
    { icon: '🛡️', title: '法律保障（好人法）', summary: '民法典第184条鼓励紧急救助，救助人不承担民事责任', body: '《中华人民共和国民法典》第184条（\"好人法\"）：因自愿实施紧急救助行为造成受助人损害的，救助人不承担民事责任。鼓励大家在紧急情况下勇敢施救。' },
    { icon: '⚠️', title: '常见误区', summary: '手肘弯曲、吹气过量、回弹不充分等常见错误', body: '• 手肘弯曲：按压效率低，应保持手臂伸直\n• 吹气过量：看到胸廓隆起即可，过度吹气导致胃胀气\n• 回弹不充分：胸廓未完全回弹会减少回心血量\n• 中断过长：中断超过10秒冠状动脉灌注压会下降\n• 不看环境：必须先确保自身安全再施救' },
    { icon: '💡', title: '心肺复苏原理', summary: '心脏骤停后尽快启动CPR，胸外按压维持大脑供氧', body: '心脏骤停后，血液循环停止。胸外按压通过挤压心脏和胸腔建立人工循环，将含氧血液输送到大脑和重要器官。心脏骤停后尽快启动CPR和使用AED是关键——越早行动，生存机会越高。' },
    { icon: '🛡️', title: '现场安全与触电处置', summary: '急救第一原则：确保施救者自身安全后再施救', body: '触电现场必须先切断电源再进入。进入带电环境会让施救者也变成受害者。用干燥绝缘物（如木棍、塑料）挑开电线，确认无电后再接近患者。环境安全是第一原则。', knowledge: 'safety' },
    { icon: '📞', title: '正确拨打 120', summary: '指定专人拨打，说清地点、患者状态、现场风险', body: '明确指定一人拨打120，告知：事发地点、患者症状（晕倒/无呼吸/无意识）、现场特殊风险（如触电）。指定另一人去取AED。不要让所有人都围观——分工清晰才能高效救援。', knowledge: 'call' },
    { icon: '🫁', title: '判断反应与呼吸', summary: '20秒内快速判断：拍肩呼唤 + 观察胸廓起伏', body: '轻拍双肩并大声呼唤判断是否有反应。观察胸廓有无正常呼吸起伏。非专业人员只需看胸廓即可判断呼吸，无须触摸脉搏。判断须在20秒内完成。濒死喘息不等于正常呼吸。', knowledge: 'breathing' },
    { icon: '🔄', title: '循环坚持与等待救援', summary: '30:2循环不间断，保持高质量CPR直到专业救援接手', body: '每约2分钟轮换按压者，避免疲劳。AED每2分钟自动分析心律。电击后立即恢复CPR。按压中断不超过10秒。持续不间断CPR直到专业急救人员到达接手。', knowledge: 'cycle' },
    { icon: '📋', title: '科普边界说明', summary: '本作品为模拟训练，不能替代线下急救培训', body: '本作品为数字化科普情景互动训练，不能替代线下急救培训或专业医疗判断。真实紧急情况请立即拨打120，并听从调度员和现场专业人员指导。作品中的按压、AED操作指南基于AHA标准，仅供科普学习参考。', knowledge: 'disclaimer' },
  ];
  const container = $('#knowledgeList');
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'knowledge-responsive-grid-container';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'knowledge-card-premium-node';
    if (item.knowledge) card.setAttribute('data-knowledge', item.knowledge);
    card.innerHTML = `<div class="knowledge-card-header-meta"><div class="knowledge-card-badge-icon">${item.icon}</div><h3 class="knowledge-card-main-title">${item.title}</h3></div><p class="knowledge-card-body-summary">${item.summary}</p><div class="knowledge-card-expanded-drawer">${item.body.replace(/\n/g, '<br>')}</div><div class="knowledge-card-footer-source">📚 参考：AHA指南 / 权威急救资料</div>`;
    card.onclick = () => { card.classList.toggle('expanded'); };
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

window._scrollToKnowledge = function(type) {
  var knowledgeType = type;
  var map = {compression:'cpr', safety:'safety', call:'call', breathing:'breathing', cycle:'cycle', disclaimer:'disclaimer', aed:'aed', cpr:'cpr', choke:'choke', trauma:'trauma'};
  knowledgeType = map[type] || type;
  goToPage(12, { force: true });
  // 侧栏高亮：展开知识库对应卡片
  setTimeout(function() {
    var cards = $$('.knowledge-card-premium-node');
    cards.forEach(function(c) { c.classList.remove('expanded'); });
    var card = $('.knowledge-card-premium-node[data-knowledge="' + knowledgeType + '"]');
    if (card) {
      card.classList.add('expanded');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
};

// ==========================================================
// 13. Particle System
// ==========================================================
let particleRaf = null;
const particles = [];

function startParticles() {
  const canvas = $('#particle-canvas');
  canvas.classList.add('active');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.min(window.innerWidth, 800) * dpr; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#16a34a', '#e53935', '#f59e0b', '#dc2626', '#2563eb', '#10b981', '#ef5350', '#3b82f6'];
  const shapes = ['heart', 'star', 'circle', 'rect'];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 8, vy: -(Math.random() * 8 + 2),
      size: Math.random() * 8 + 3, color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360, rotSpd: (Math.random() - 0.5) * 15,
      life: 1, shape: shapes[Math.floor(Math.random() * shapes.length)],
      gravity: 0.03 + Math.random() * 0.05
    });
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.vy += p.gravity; p.y += p.vy; p.rot += p.rotSpd; p.life -= 0.003;
      p.vx *= 0.995;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      if (p.shape === 'heart') {
        ctx.beginPath();
        const s = p.size / 12;
        ctx.moveTo(0, s * 3);
        ctx.bezierCurveTo(-s * 6, -s, -s * 6, -s * 5, 0, -s * 2);
        ctx.bezierCurveTo(s * 6, -s * 5, s * 6, -s, 0, s * 3);
        ctx.fill();
      } else if (p.shape === 'star') {
        ctx.beginPath();
        const s = p.size / 2;
        for (let j = 0; j < 5; j++) {
          const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = j % 2 === 0 ? s : s * 0.4;
          j === 0 ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a)) : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        ctx.closePath(); ctx.fill();
      } else if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();
    }
    if (particles.length < 20 && particles.length > 0) {
      const last = particles[particles.length - 1];
      particles.push({
        x: last.x, y: last.y,
        vx: (Math.random() - 0.5) * 8, vy: -(Math.random() * 8 + 2),
        size: Math.random() * 8 + 3, color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360, rotSpd: (Math.random() - 0.5) * 15,
        life: 1, shape: shapes[Math.floor(Math.random() * shapes.length)],
        gravity: 0.03 + Math.random() * 0.05
      });
    }
    particleRaf = requestAnimationFrame(draw);
  }
  draw();
}

function stopParticles() {
  if (particleRaf) { cancelAnimationFrame(particleRaf); particleRaf = null; }
  particles.length = 0;
  const canvas = $('#particle-canvas');
  if (canvas) {
    canvas.classList.remove('active');
    const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ==========================================================
// 14. Reset
// ==========================================================
function resetAll() {
  Timer.reset();
  stopParticles();
  if (pressTimerInterval) { clearInterval(pressTimerInterval); pressTimerInterval = null; }
  if (aedTimerInterval) { clearInterval(aedTimerInterval); aedTimerInterval = null; }
  if (bcTimerInterval) { clearInterval(bcTimerInterval); bcTimerInterval = null; }
  if (bcObserveInterval) { clearInterval(bcObserveInterval); bcObserveInterval = null; }
  if (window._scorePanelInterval) { clearInterval(window._scorePanelInterval); window._scorePanelInterval = null; }
  if (window._pcWrapperInterval) { clearInterval(window._pcWrapperInterval); window._pcWrapperInterval = null; }
  if (rbRaf) { cancelAnimationFrame(rbRaf); rbRaf = null; }
  if (_rbWaveRaf) { cancelAnimationFrame(_rbWaveRaf); _rbWaveRaf = null; }
  if (window._rbBreathNodes) { try { window._rbBreathNodes.forEach(function(n){n.stop();}); } catch(e) {} window._rbBreathNodes = null; }
  state.currentPage = 1;
  state.sceneType = null;
  state.totalTime = 0;
  state.scores = { env: 0, call: 0, breathCheck: 0, compression: 0, rescueBreath: 0, aed: 0, cycle: 0, timeBonus: 0 };
  state.compressionData = { timestamps: [], depthValues: [], rateValues: [], depthResults: [], rateResults: [], reboundViolations: 0, totalPresses: 0, depthOkCount: 0, rateOkCount: 0, positionOkCount: 0, interruptionCount: 0, totalInterruptionTime: 0, _wasInterrupted: false, avgBpm: 0, avgDepth: 0, depthGoodRate: 0, rateGoodRate: 0, correctPresses: 0, pressStartTime: 0, lastPressTime: 0 };
  state.cycleCount = 0; state.cycleRound = 0; state._lastModalRound = 0; state.aedStep = 0; state.aedPadsPlaced = {};
  state.fatigueTriggered = false; state.sortRetry = false; state.completed = {};
  state.checkStep = 0;
  state.riskEvents = []; window._aedPoweredOn = false;
  state.timeoutWarned = false;
  delete state.breathCheckTrainer; delete state.rescueBreathTrainer;
  window._sortUserOrder = null; window._sortPicked = null;
  $$('.page').forEach(p => p.classList.remove('active'));
  $('.page[data-page="1"]').classList.add('active');
  updateGlobalHeader(1);
  try { window.history.pushState({ page: 1 }, '', '#page1'); } catch(e) {}
  enterPage1();
}

// ==========================================================
// 15. Event Bindings
// ==========================================================
// Dark mode toggle
// Desktop + mobile dark mode toggle
if(window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches&&!localStorage.getItem('cprDarkMode')){document.body.classList.add('dark');$('#darkToggle').textContent='☀️';}
$('#darkToggle').addEventListener('click', toggleDarkMode);
var _dtm = document.getElementById('darkToggleMobile');
if (_dtm) _dtm.addEventListener('click', toggleDarkMode);
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  var isDark = document.body.classList.contains('dark');
  var icon = isDark ? '☀️' : '🌙';
  $('#darkToggle').textContent = icon;
  var dtm = document.getElementById('darkToggleMobile');
  if (dtm) dtm.textContent = icon;
  try { localStorage.setItem('cprDarkMode', isDark ? '1' : '0'); } catch(e) {}
}

$('#resetRecordBtn') && $('#resetRecordBtn').addEventListener('click', () => {
  showModal({
    type: 'confirm', title: '重置记录', text: '确定要清除历史最佳成绩吗？',
    onConfirm: () => {
      try { localStorage.removeItem('emergencyHero'); } catch(e) {}
      state.bestScore = 0;
      $('#bestScoreDisplay').innerHTML = '历史最佳：<strong>--</strong> 分';
      showToast('记录已清零', 'info');
    }
  });
});

// Wire up homepage secondary buttons
$('#scienceBtn2') && $('#scienceBtn2').addEventListener('click', function() {
  showSciencePanel();
});
$('#knowledgeBtn2') && $('#knowledgeBtn2').addEventListener('click', function() {
  showKnowledgePreview();
});
$('#videoBtn') && $('#videoBtn').addEventListener('click', function() {
  showVideoList();
});

$('#headerBackBtn').addEventListener('click', () => {
  showModal({
    type: 'confirm', title: '退出训练', text: '训练进度将丢失，确定退出吗？',
    onConfirm: () => resetAll()
  });
});

$('#aiHelperBtn').addEventListener('click', toggleAiBubble);
$('#aiBubble').addEventListener('click', () => $('#aiBubble').classList.remove('show'));

// Vibration toggle sync
$('#vibrationToggle').addEventListener('change', (e) => {
  state.vibrationEnabled = e.target.checked;
  Storage.save({ vibrationEnabled: state.vibrationEnabled });
});
$('#vibrationToggle2').addEventListener('change', (e) => {
  state.vibrationEnabled = e.target.checked;
  $('#vibrationToggle').checked = e.target.checked;
  Storage.save({ vibrationEnabled: state.vibrationEnabled });
});

// Keyboard support for Space press is now managed via onPressKeyDown/onPressKeyUp
// (added in enterPage6, removed in stopCompression/endCompression)

// History back
window.addEventListener('popstate', (e) => {
  if (state.currentPage > 1) {
    showModal({
      type: 'confirm', title: '确定要退出吗？', text: '训练进度将丢失。',
      onConfirm: () => resetAll(),
      onCancel: () => { try { window.history.replaceState({ page: state.currentPage }, '', `#page${state.currentPage}`); } catch(e) {} }
    });
  }
});

// ==========================================================
// 16. Initialization
// ==========================================================

// ═══════════════════════════════════════
// DASHBOARD + EXPANDED MULTI-MODULE SYSTEM
// ═══════════════════════════════════════
(function(){
  if (typeof $==='undefined') return;

  var sidebarItems = $$('.sidebar-item');
  // 侧边栏导航：click + 键盘 Enter/Space
  sidebarItems.forEach(function(item) {
    var nav = parseInt(item.dataset.nav);
    if (!nav) return;
    item.addEventListener('click', function() {
      if (nav >= 26 && nav <= 50) { showModPage(nav, item.textContent.trim()); return; }
      if (nav >= 2 && nav <= 12 && nav > (state.mainPosition || 1) + 1) {
        showModal({ type: 'warning', title: '请按顺序操作', text: '请先完成当前步骤再继续。' });
        return;
      }
      goToPage(nav);
    });
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
  var panelDesc = $('#panelDesc');

  var panelWarning = $('#panelWarning');
  var panelGuide = $('#panelGuide');
  var panelData = $('#panelData');
  var panelScore = $('#panelLiveScore');
  var modScore = {aed:0, aedEx:0, choke:0, chEx:0, trauma:0, trEx:0};

  function updateSidebar(p) {
    try {
      var highlightNav = p;
      if (p >= 26 && p <= 33) highlightNav = 26;
      else if (p >= 34 && p <= 42) highlightNav = 34;
      else if (p >= 43 && p <= 50) highlightNav = 43;
      sidebarItems.forEach(function(item) {
        var n = parseInt(item.dataset.nav);
        item.classList.remove('active','done','locked');
        if (n === highlightNav) item.classList.add('active');
        if (p >= 1 && p <= 12 && state.completed && state.completed[n]) item.classList.add('done');
        // 锁定不可跳转的页面（只能回退、当前页、下一页）
        // 使用 mainPosition 避免模块页(26+)覆盖主流程进度
        var lockPos = (p >= 1 && p <= 12) ? p : (state.mainPosition || 1);
        if (n >= 2 && n <= 12 && n > lockPos + 1) item.classList.add('locked');
      });
    } catch(e) {}
  }

  // ── Scene-aware tips database ──
  var stepWarnings = {
    1:"本训练为模拟体验，不能替代线下实操。关键时刻请拨打120并听从调度员指导。",
    2:"旁观者越多反而越少人行动（旁观者效应）。你第一个上前，就能带动更多人。不确定患者是否心脏骤停时，宁可开始CPR。",
    3:"浴室触电：先断电！干燥木棍挑开电线。煤气泄漏：不开灯、不打电话、先开窗。马路：让人拦车，把患者移到安全地带。",
    4:"120调度员受过专业训练，会一步步指导你。开免提，双手解放出来。紧张说不出话就回答调度员的问题。加微信发定位可省去描述地址时间。",
    5:"濒死喘息（agonal breathing）看起来像喘气但无效。10秒内数胸廓起伏次数，0次或只有喘息请立即CPR。不要浪费时间摸脉搏。",
    6:"所有性别按压位置相同：胸骨正中央下半段，不是乳头连线。<br>对乳房丰满者：用手背将乳房推向一侧，确保掌根落在胸骨上。<br>成人（≥8岁）：深度5-6cm，双手掌根重叠。<br>儿童（1-8岁）：深度约5cm，单手掌根。<br>婴儿（<1岁）：深度约4cm，用两指。<br>老年及瘦小体型：骨质疏松风险高，按压深度不变，宁可骨折也要保证有效按压。<br>大体重者：按压力度需更大，建议1分钟后换人保持质量。",
    7:"不愿做口对口？只做胸外按压同样有效（Hands-Only CPR）。<br>口鼻有血或呕吐物？只做按压，等专业人员。<br>吹气时见胸廓鼓起就停，过度吹气致胃胀气。<br>婴儿：同时包住口鼻，轻轻吹气（脸颊轻吹的量）。",
    8:"贴片前擦干胸部皮肤。胸毛浓密者：用备用电极片或剃刀。<br>体内有起搏器：电极片避开至少2.5cm。<br>孕妇：AED同样适用，位置不变。<br>儿童（<8岁）：儿童电极片或儿童模式，贴片胸前+后背。",
    9:"高质量CPR核心：少中断、够深、够快、充分回弹。中断超过10秒，冠脉灌注压归零。<br>按压1分钟后质量下降，2分钟显著下降。必须换人。<br>多人协作：一人按压、一人通气、一人AED、一人联系120。",
    10:"真实场景中即使操作完美，存活率也受多种因素影响。不要因结果自责。你尽了力，比什么都不做强。",
    11:"建议每6个月复习一次CPR+AED操作。技能会遗忘，但关键时刻肌肉记忆能救命。",
    12:"建议每6个月复习一次CPR+AED操作。技能会遗忘，但关键时刻肌肉记忆能救命。"
  };
  var sceneGuide = {
    1:"选择下方训练模块，开始一次急救情景模拟。心肺复苏的每个环节都将给出实时指导。",
    2:"旁观者效应：人群中每个人都在等别人先行动。你第一个上前，其他人就会跟上。<br>法律保护：《民法典》第184条——因自愿实施紧急救助造成受助人损害的，救助人不承担民事责任。<br>你的第一步：走近患者，轻拍双肩，大声呼唤。不确定时先呼叫120。",
    3:"先扫一眼：头顶有无坠落物？脚下有无水渍/电线？周围有无车辆？<br>浴室/厨房：先断电再进入。湿手不碰电器。用干木棍挑开电线。<br>马路/公园：让人拦车、远离道路。把患者移到安全平地。<br>地铁/商场：让人群散开，找工作人员协助，看有无AED标识。",
    4:"说清三件事：①具体地址（街道+小区+楼号+楼层）②患者无反应/无呼吸③你的电话号码。<br>加微信发定位：很多城市120支持微信视频指导CPR。主动问调度员「可以加微信发定位吗？」<br>开免提：双手要做CPR，全程免提通话。让旁边人帮忙拿手机。<br>指定人取AED：不要喊「谁去拿AED」，要指着具体人说：「你，去取AED！」<br>别先挂电话：调度员挂断前保持通话，他会指导你做CPR。",
    5:"轻拍重唤：拍双肩+大声喊「喂！你还好吗？」——不是轻轻碰一下。<br>看胸廓10秒：看胸口有没有起伏，不是摸脉搏。濒死喘息（间断倒吸气）不是正常呼吸。<br>不确定就当没呼吸：宁可开始CPR后发现是虚惊，也不能因犹豫延误。",
    6:"位置：两乳头连线中点，胸骨中下段。不是左胸心脏位置。<br>深度：5-6cm≈信用卡短边。用身体重量，不是手臂力量。<br>节奏：脑子里哼《小苹果》——100-120BPM。<br>回弹：每次抬起让胸廓完全弹回。手掌不要离开胸壁。<br>换人：2分钟后体力下降，叫旁边人接替。按压质量比逞强重要。",
    7:"仰头抬颏：一手压额头向后，另一手两指抬下巴。这是让气道通畅的关键动作。<br>捏鼻吹气：捏住鼻子，嘴包住嘴，吹1秒停1秒。见胸廓隆起即可，不要猛吹。<br>不做吹气也行：不熟练/担心传染病/患者口鼻有血——只做按压同样有效。",
    8:"开机即用：打开盖子自动开机，跟着语音做。不需要任何培训。<br>贴片位置：电极片包装上有图示——右上胸锁骨下+左侧腋前线。<br>擦干皮肤：汗水/水渍会让电极片粘不牢。撕掉身上的膏药贴片。<br>电击前喊「闪开」：视觉确认无人接触患者，然后按闪烁的放电键。<br>电击后立刻继续按压：不要取电极片，不要关机。AED过2分钟会再分析一次。",
    9:"30:2一直循环：30次按压→2次吹气→30次按压→...AED分析时暂停。<br>每2分钟换人：按压质量在1分钟后开始下降。换人时中断不超过5秒。<br>等专业救援接手：不要自己判断「好了」就停。等到120急救人员说「我来」为止。",
    10:"查看你的训练成绩和风险回放。绿色项是已掌握的，红色项是下次重点改进的。",
    11:"查看你的训练成绩和风险回放。绿色项是已掌握的，红色项是下次重点改进的。",
    12:"复习急救知识点，生成训练记录。敢救不是一次训练的事——建议每6个月复习一次。"
  };
  var sceneTips = {
    park: {
      name: '🌳 公园',
      warnings: {3:'⚠️ 注意：公园可能有车辆、宠物、不平坦地面。确保施救区域安全，远离道路。',4:'📞 公园内描述位置：靠近哪个门？有什么标志物？长椅编号？',6:'💡 公园地面较硬，可在患者身下垫衣物。户外注意天气——雨天尽快转移至遮蔽处。',8:'⚡ 公园AED通常在游客中心、保安亭。让路人分头寻找，告知"橙色AED标志箱"。'},
      aed: '公园AED查询：游客中心、保安亭、售票处。部分城市公园在路灯杆上安装了AED。每延迟1分钟除颤，存活率下降7-10%。',
      data: '成人按压5-6cm深 | 允许胸廓完全回弹 | 中断不超过10秒 | 每2分钟轮换按压者'
    },
    court: {
      name: '🏀 球场',
      warnings: {3:'⚠️ 球场地面较硬适合按压，但注意周围可能有散落的器材、水渍。让围观者退开留出空间。',4:'📞 球场位置：XX球场几号场地？靠近哪个建筑？让球友去场馆管理处取AED。',6:'💡 球场地面硬度适中非常适合CPR。利用球衣垫在患者身下。如有队医立即呼叫。',8:'⚡ 体育馆AED通常在办公室、器材室、前台。大型赛事场馆每层都有。'},
      aed: '体育场馆AED：前台、医疗室、器材室。2020 AHA指南强调运动相关心脏骤停中AED+CPR的组合可将生存率提升至50%以上。',
      data: '运动性猝死90%是心源性 | AED应在3分钟内使用 | 按压至少5cm深度 | 允许完全回弹'
    },
    bathroom: {
      name: '🚿 浴室',
      warnings: {3:'⚡ 触电场景！切勿直接进入。必须先切断总电源或拔掉热水器插头。用干燥木棍、塑料扫把挑开电线。确认无电后再施救。',4:'📞 触电急救：告知120是"触电导致的心脏骤停"，需额外注意电击伤和烧伤。',6:'💡 先将患者移到干燥区域。用干毛巾擦干患者胸部——潮湿皮肤会影响电极片粘贴和导电。',8:'⚡ 贴电极片前必须用干毛巾彻底擦干胸部皮肤！水+电=AED误判+皮肤灼伤风险。'},
      aed: '潮湿环境AED：必须擦干患者胸部！水导电会导致电极片粘贴不牢、电流分散、灼伤皮肤。如患者浸在水中，先移到干燥处。',
      data: '潮湿环境必须擦干胸部 | 确认断电再进入 | 触电可导致不规则心律 | 电极片需牢固粘贴'
    },
    subway: {
      name: '🚇 地铁站',
      warnings: {3:'⚠️ 地铁站人流密集，先示意周围人散开。留意列车运行——远离站台边缘。寻找工作人员协助维持秩序。',4:'📞 地铁站内描述：XX线XX站、B2层站台、靠近X号出口。让工作人员用对讲机通知控制中心。',6:'💡 地铁站通常配备AED和急救箱。让工作人员引导乘客离开，创造安静施救空间。',8:'⚡ 地铁站AED位置：站台两端、客服中心旁。车厢内通常没有，需到站台上取。'},
      aed: '地铁站AED查询：站台两端橙色箱体、客服中心旁。中国主要城市地铁已基本配备AED。让工作人员用广播呼叫"有急救员请速到X位置"。',
      data: '地铁站必配AED | 广播呼叫专业急救员 | 保持呼吸道通畅 | 防止踩踏保持秩序'
    },
    home: {
      name: '🏠 家中',
      warnings: {3:'⚠️ 居家急救：确认环境安全（无煤气泄漏、电器危险）。如有家人在场，分工：一个CPR、一个打120、一个去楼下接救护车。',4:'📞 家中呼救：告知120详细地址（XX小区X栋X单元X号）、楼层有无电梯。安排人去小区门口接救护车。',6:'💡 家中可在硬地板（客厅瓷砖、木地板）上进行CPR。床太软不适合——把患者移到地板上。',8:'⚡ 家中通常无AED。持续高质量CPR直到救护车到达。如果小区物业或邻居有AED，立即让人去取。'},
      aed: '家庭AED：中国家庭AED普及率极低。持续CPR直到EMS到达。按压中断不超过10秒。每2分钟检查一次脉搏——如恢复则停止按压。',
      data: '持续CPR直到救护车到 | 硬地板优于床垫 | 每2分钟轮换 | 保持手机免提与120通话'
    }
  };

  function updatePanel(p) {
    var steps = {
      1:'选择训练模块开始一次敢救训练。心肺复苏CPR包含完整的急救链训练。',
      2:'观察现场情况，判断患者状态。不同场景有不同的安全注意事项。',
      3:'环境安全是急救第一步。先确保自身安全，排除危险后再接近患者。',
      4:'拨打120并获取AED。清晰描述地点、患者症状和现场特殊风险。',
      5:'20秒内快速判断。先拍肩呼喊判断反应，再看胸廓起伏判断呼吸。',
      6:'胸外按压。深度5-6cm，频率100-120次/分，保证完全回弹。',
      7:'开放气道后进行人工呼吸。按压通气比30:2。不熟练者可仅做胸外按压。',
      8:'AED操作：开机→贴片→分析→电击。电击后立即恢复CPR。',
      9:'30:2循环不间断。每约2分钟轮换按压者。持续到专业救援接手。',
      10:'训练结束！查看智能训练报告，了解你的急救能力评估。',
      11:'训练报告——查看总分、评级、雷达图和个性化训练建议。',
      12:'急救知识库——复习关键知识点，获取模拟训练完成证书。',
      26:'AED专项训练——学习不同场景下自动体外除颤仪的使用。',
      27:'AED第一步：识别心脏骤停，判断是否需要使用AED。',
      28:'AED第二步：开启设备，按照语音提示操作。',
      29:'AED第三步：正确粘贴电极片——右锁骨下+左腋前线。',
      30:'AED第四步：分析心律，确保无人接触患者。',
      31:'AED第五步：实施电击，电击后立即恢复CPR。',
      32:'AED特殊情况：潮湿环境、儿童、植入式设备患者的注意事项。',
      33:'AED训练完成——查看你的AED操作评分和改进建议。',
      34:'气道梗阻急救——学习海姆立克法的正确操作。',
      35:'识别气道梗阻：完全梗阻vs不完全梗阻的判断。',
      36:'成人海姆立克法：剪刀石头布定位+向内上冲击。',
      37:'孕妇及肥胖者：胸部冲击法替代腹部冲击。',
      38:'婴儿气道梗阻：5次背部拍击+5次胸部冲击交替。',
      39:'自救方法：借助椅背或桌角实施腹部冲击。',
      40:'梗阻解除后的观察与后续处理。',
      41:'特殊场景：意识丧失者转为CPR。',
      42:'气道梗阻训练完成——查看你的操作评分和改进建议。',
      43:'创伤急救基础——学习止血·包扎·固定·搬运四项技术。',
      44:'DRABC评估法：确认安全→判断反应→开放气道→检查呼吸→检查循环。',
      45:'直接压迫止血：用干净纱布直接压迫出血部位。',
      46:'包扎固定：绷带与三角巾的正确使用方法。',
      47:'骨折处理：固定范围超过骨折部位上下两个关节。',
      48:'安全搬运：保持头颈躯干成一直线。',
      49:'特殊伤情：烧伤、刺入物、断肢的处理原则。',
      50:'创伤急救训练完成——查看你的操作评分和改进建议。'
    };
    var specTips = {
      26:{w:'AED在机场、地铁、商场等公共场所越来越普及。学会使用AED是每个公民都可以掌握的救命技能。',a:'AED负责"重启"心脏，CPR负责维持供血。两者必须配合使用。',d:'室颤为最常见可电击心律 | AED 1分钟内除颤存活率约90%'},
      27:{w:'无反应+无呼吸/濒死喘息=立即启动急救系统。派人取AED同时开始CPR。',a:'心脏骤停后尽快使用AED——每延迟1分钟，存活率下降7-10%。',d:'心脏骤停识别三部曲：拍肩呼喊→观察呼吸→触摸脉搏'},
      28:{w:'开机后AED会自动语音引导。不要被语音吓到——按提示操作即可。',a:'AED设计非常简洁，即使从未使用过也能在语音引导下完成操作。',d:'AED开机键通常为绿色 | 屏幕显示操作步骤 | 语音同步播报'},
      29:{w:'贴片前擦干患者胸部！水渍会导致电极片粘贴不牢、电流分散、灼伤皮肤。',a:'电极片位置：①右锁骨下（右上胸）②左腋前线（左侧乳头外侧）。',d:'电极片必须直接贴在裸露皮肤上 | 避开金属饰品和药物贴片'},
      30:{w:'分析心律时任何人不得接触患者！身体接触会干扰分析结果。',a:'AED分析的是心脏电活动，判断是否为可除颤心律（室颤/无脉性室速）。',d:'分析时间约5-15秒 | 保持环境静止 | 确认无人接触'},
      31:{w:'电击前必须确认所有人离开患者！大声喊"闪开！"并视觉确认。',a:'电击后不要取下电极片，立即从胸外按压开始继续CPR。',d:'双相波AED能量150-200J | 电击后按压中断不超过10秒'},
      32:{w:'潮湿环境必须擦干皮肤！儿童使用儿童电极片或成人替代贴法。',a:'植入式起搏器/ICD患者：电极片避开设备位置至少2.5cm。',d:'儿童AED能量减半 | 水中不能使用AED | 先移离水源'},
      33:{w:'训练报告仅反映知识点掌握程度，不能替代线下实操认证。',a:'建议每2年复训一次AED操作，保持技能熟练度。',d:'AED操作四步法：开机→贴片→分析→电击'}
    };
    // 气道梗阻专项提示
    var chokeTips = {
      34:{w:'完全气道梗阻是危及生命的紧急情况——患者无法说话、咳嗽、呼吸，面色发紫。',a:'海姆立克法是利用腹部冲击产生的气流将异物冲出气道。',d:'完全梗阻4-6分钟内可导致脑损伤 | 立即行动不要犹豫'},
      35:{w:'轻度梗阻：患者能咳嗽、说话→鼓励继续咳嗽。重度梗阻：无声、发紫→立即海姆立克。',a:'判断标准：能否发声+能否呼吸+面色的变化。',d:'不完全梗阻不要拍背 | 可能使异物更深'},
      36:{w:'剪刀石头布：剪刀=肚脐上方两指定位、石头=一手握拳、布=另一手包住拳头向内上冲击。',a:'每次冲击应快速有力，方向为向内+向上。',d:'每次冲击后检查异物是否排出 | 通常需5-10次'},
      37:{w:'孕妇和肥胖者腹部冲击无效甚至危险。改为胸部冲击——双手放在胸骨中下段。',a:'冲击位置：胸骨中下段（与CPR按压位置相同）。',d:'每次冲击后检查效果 | 力度适中避免骨折'},
      38:{w:'婴儿<1岁：不可用成人海姆立克法！采用5次背部拍击+5次胸部冲击交替。',a:'背部拍击：婴儿面朝下趴在手臂上，手掌根部拍击肩胛骨之间。',d:'每次拍击和冲击后检查口腔 | 不可用手指盲目掏取'},
      39:{w:'独自一人时：用椅背或桌角对准腹部快速冲击，或将拳头对准腹部向后撞击椅子。',a:'自救时冲击位置与海姆立克法相同——肚脐上方两指处。',d:'自救后仍需就医检查 | 冲击可能导致内伤'},
      40:{w:'解除梗阻后检查呼吸和脉搏。如果患者仍无反应→立即CPR。',a:'即使梗阻解除，也建议到医院检查——冲击可能导致内脏损伤。',d:'梗阻解除后观察面色是否恢复红润 | 检查有无肋骨损伤'},
      41:{w:'如果患者失去意识→立即开始CPR！每次按压可能将异物进一步排出。',a:'CPR时可以观察到口中异物——见到异物才清除。',d:'意识丧失后气道肌肉松弛 | 异物可能更容易排出'},
      42:{w:'训练报告仅反映操作熟练度，不能替代线下急救认证培训。',a:'海姆立克法是每位公民都应掌握的急救技能——建议线下实操练习。',d:'海姆立克法存活率与施救及时性正相关'}
    };
    // 创伤急救专项提示
    var traumaTips = {
      43:{w:'创伤急救第一原则：先确保自身安全。进入危险现场会让施救者变成第二受害者。',a:'DRABC评估法是最基础的创伤评估框架。',d:'创伤急救黄金时间：严重出血需在5分钟内控制'},
      44:{w:'D=Danger先确认安全→R=Response拍肩呼唤→A=Airway开放气道→B=Breathing观察呼吸→C=Circulation检查脉搏和出血。',a:'DRABC评估必须在1-2分钟内完成，然后优先处理最危及生命的问题。',d:'评估顺序不可跳步 | 每步发现异常立即处理'},
      45:{w:'直接压迫是最有效的止血方法——用干净纱布或布料直接压住出血部位，持续施压。',a:'不要频繁揭开查看——会破坏已经形成的血凝块。如果纱布浸透，在上面再加一层。',d:'严重出血可导致几分钟内休克 | 止血带仅用于四肢不可控出血'},
      46:{w:'绷带包扎从远心端向近心端缠绕，松紧适度——过紧影响血液循环。',a:'三角巾可做成大手挂、小手挂、头部包扎等多种形式。',d:'包扎后检查末梢循环 | 指端发紫说明过紧'},
      47:{w:'怀疑骨折时不要尝试复位！固定范围应超过骨折部位上下两个关节。',a:'可用夹板、杂志、木板等硬质材料作为临时固定物。',d:'开放性骨折不冲洗不回纳 | 覆盖无菌敷料后固定'},
      48:{w:'除非现场不安全（火灾、爆炸等），不要随意移动伤者。搬运时保持头颈与躯干成一条直线。',a:'脊椎损伤怀疑→必须使用硬质担架或脊椎板固定后再搬运。',d:'不当搬运可导致截瘫 | 多人协作时统一口令'},
      49:{w:'烧伤：流水冲洗15分钟以上→覆盖干净敷料→不涂抹任何东西。刺入物：不要拔除→固定后送医。',a:'断肢：清洁包裹→放入防水袋→冰水保存（不可直接接触冰块）。',d:'烧伤面积>10%需紧急送医 | 化学烧伤干粉清除后再冲洗'},
      50:{w:'训练报告仅反映知识掌握程度，创伤急救需要线下实操练习。',a:'建议参加红十字会或AHA的急救培训课程获得认证。',d:'四项技术：止血→包扎→固定→搬运'}
    };
    var sceneName = '📍 专项训练';
    var st = {};
    if (p >= 26 && p <= 33) { sceneName = '⚡ AED专项训练'; st = specTips[p] || specTips[26]; }
    else if (p >= 34 && p <= 42) { sceneName = '🫁 气道梗阻急救'; st = chokeTips[p] || chokeTips[34]; }
    else if (p >= 43 && p <= 50) { sceneName = '🩹 创伤急救基础'; st = traumaTips[p] || traumaTips[43]; }
    else {
      sceneName = (state.sceneType && sceneTips[state.sceneType]) ? sceneTips[state.sceneType].name : '📍 未开始';
      st = sceneTips[state.sceneType] || sceneTips.park;
    }
    try { if (panelDesc) panelDesc.textContent = steps[p] || steps[1]; } catch(e) {}

    try { if (panelWarning) { var warnText = stepWarnings[p] || st.w || '按当前步骤操作，注意各项提示。'; panelWarning.innerHTML = warnText; } } catch(e) {}
    try { if (panelGuide) { var guideText = sceneGuide[p] || st.a || '认真学习急救知识，关键时刻能救人一命。'; panelGuide.innerHTML = guideText; } } catch(e) {}
    try {
      var mpGuide=document.getElementById("mpGuide"), mpWarning=document.getElementById("mpWarning"), mpData=document.getElementById("mpData");
      if(mpGuide)mpGuide.innerHTML=sceneGuide[p]||st.a||"";

      if(mpWarning&&panelWarning)mpWarning.innerHTML=panelWarning.innerHTML;
      if(mpData&&panelData)mpData.textContent=panelData.textContent;
    } catch(e) {}
    try { if (panelData) panelData.textContent = st.d || '急救技能需要反复练习才能熟练掌握。'; } catch(e) {}
    try {
      var liveScore = getLiveScoreByPage(p);
      if (panelScore) panelScore.textContent = liveScore;
    } catch(e) {}
  }
  function getLiveScoreByPage(p) {
    if (p >= 26 && p <= 33) return modScore.aedEx || 0;
    if (p >= 34 && p <= 42) return modScore.chEx || 0;
    if (p >= 43 && p <= 50) return modScore.trEx || 0;
    var total = 0;
    for (var k in state.scores) { total += state.scores[k] || 0; }
    return total;
  }

  var _origGoToPage = goToPage;
  goToPage = function(targetPage, opts) {
    _origGoToPage(targetPage, opts);
    updateSidebar(targetPage);
    updatePanel(targetPage);
  };


  function showModPage(n, title) {
    // Shuffle any static quiz options on the target page
    setTimeout(function(){
      var pageEl = document.querySelector('.page[data-page="'+n+'"]');
      if(pageEl){
        pageEl.querySelectorAll('.quiz-option[data-ok]').forEach(function(q){
          var parent=q.parentElement; if(!parent)return;
          var all=Array.from(parent.querySelectorAll('.quiz-option[data-ok]'));
          shuffle(all); all.forEach(function(b){parent.appendChild(b);});
        });
      }
    },50);
    // 清理当前页状态（停止计时器/节拍器/语音等）
    if (typeof onPageLeave === 'function') { onPageLeave(state.currentPage); }
    // 切换页面
    $$('.page').forEach(function(p) { p.classList.remove('active'); });
    var el = $('.page[data-page="'+n+'"]');
    if (el) { el.classList.add('active'); el.scrollTop = 0; }
    // 更新chrome
    state.currentPage = n;
    $('#global-header').classList.remove('hidden');
    $('#global-footer').classList.add('hidden');
    $('#headerStep').textContent = title || '';
    // 同步侧栏和面板
    updateSidebar(n);
    updatePanel(n);
    try { window.history.pushState({ page: n }, '', '#page' + n); } catch(e) {}
  }

  function goHome() {
    $$('.page').forEach(function(p) { p.classList.remove('active'); });
    $('.page[data-page="1"]').classList.add('active');
    $('#global-header').classList.add('hidden'); $('#global-footer').classList.add('hidden');
    state.currentPage = 1;
    state.mainPosition = 1;
    try { var sb=document.getElementById('sidebar'); var sp=document.getElementById('sidePanel'); if(sb)sb.style.display=''; if(sp)sp.style.display=''; } catch(e) {}
    updateSidebar(1); updatePanel(1);
  }

  // ─── Generic Quiz Handler ───
  function initQuiz(qId, fbId, btnId, pts, onWin, failMsg, winMsg) {
    // Shuffle quiz options
    var container = document.getElementById(qId);
    if (container) { var btns = Array.from(container.querySelectorAll('.quiz-option')); shuffle(btns); btns.forEach(function(b){container.appendChild(b);}); }
    var done = false;
    try { $('#'+fbId).style.display='none'; $('#'+btnId).style.display='none'; } catch(e) {}
    try {
      $$('#'+qId+' .quiz-option').forEach(function(b) {
        b.className='quiz-option'; b.onclick=function() {
          if (done) return; done = true;
          if (this.dataset.ok==='1') {
            this.classList.add('correct');
            try { $('#'+fbId).className='quiz-feedback success show'; $('#'+fbId).textContent=winMsg||'✅正确！'; $('#'+btnId).style.display='block'; } catch(e) {}
            if (onWin) onWin();
          } else {
            this.classList.add('wrong');
            try { $('#'+fbId).className='quiz-feedback error show'; $('#'+fbId).textContent=failMsg||'❌请重新选择。'; } catch(e) {}
            setTimeout(function() { done=false; b.classList.remove('wrong'); try { $('#'+fbId).style.display='none'; } catch(e) {} }, 1500);
          }
        };
      });
    } catch(e) {}
  }

  function initMultiQuiz(qId, fbId, btnId, pts, onWin) {
    var done = false;
    var fbEl = $('#'+fbId);
    var btnEl = $('#'+btnId);
    if (fbEl) { fbEl.style.display = 'none'; fbEl.className = 'quiz-feedback'; }
    if (btnEl) { btnEl.style.display = 'none'; btnEl.textContent = '提交答案 →'; }
    var opts = $$('#'+qId+' .quiz-option');
    if (!opts || opts.length === 0) return;
    opts.forEach(function(b) {
      b._selected = false;
      b.addEventListener('click', function() {
        if (done) return;
        b._selected = !b._selected;
        b.classList.toggle('selected', b._selected);
        var anySel = false;
        opts.forEach(function(o) { if (o._selected) anySel = true; });
        if (btnEl) { btnEl.style.display = anySel ? 'block' : 'none'; }
        if (fbEl) fbEl.style.display = 'none';
      });
    });
    if (btnEl) btnEl.onclick = function() {
      if (done) return;
      done = true;
      var allOk = true;
      opts.forEach(function(o) {
        if (o._selected !== (o.dataset.ok === '1')) allOk = false;
      });
      if (allOk) {
        opts.forEach(function(o) { o.classList.add('correct'); });
        if (fbEl) { fbEl.className = 'quiz-feedback success show'; fbEl.textContent = '✅ 完全正确！'; fbEl.style.display = 'block'; }
        if (btnEl) { btnEl.textContent = '继续→'; }
        Audio.ding();
        if (onWin) onWin();
      } else {
        opts.forEach(function(o) { if (o._selected && o.dataset.ok !== '1') o.classList.add('wrong'); });
        if (fbEl) { fbEl.className = 'quiz-feedback error show'; fbEl.textContent = '❌ 选择有误，请重试。'; fbEl.style.display = 'block'; }
        Audio.buzzer();
        setTimeout(function() {
          done = false;
          opts.forEach(function(o) { o._selected = false; o.classList.remove('selected','correct','wrong'); });
          if (fbEl) fbEl.style.display = 'none';
          if (btnEl) { btnEl.style.display = 'none'; btnEl.textContent = '提交答案 →'; }
        }, 1200);
      }
    };
  }

  // ═══════════════ AED EXPANDED (26-33) ═══════════════
  window._startAed = function() {
    Audio.init(); modScore.aedEx = 0;
    window._aedAttempts = (window._aedAttempts || 0) + 1;
    if (window._aedAttempts > 1) { showToast('第' + window._aedAttempts + '次尝试（重复作答会降低评分）', 'info'); }
    var intros = ['你在<span class="highlight">购物中心</span>看到有人突然倒地。周围的人在做CPR。<b>AED到了——你知道怎么用吗？</b>','在<span class="highlight">机场</span>，旅客突然失去意识。保安取来了AED。<b>让我们学习正确操作。</b>','<span class="highlight">公司里</span>同事晕倒。前台拿来了AED。<b>AED并不复杂——它的设计让普通人也能使用。</b>'];
    try { $('#aedEx1Intro').innerHTML = intros[Math.floor(Math.random()*intros.length)]; } catch(e) {}
    showModPage(26, 'AED专项训练');
    // Page 26: 多选Quiz，答案正确后显示"继续"按钮
    initMultiQuiz('aedEx1Quiz','aedEx1Fb','aedEx1Btn',15,function(){
      modScore.aedEx+=15;
      $('#aedEx1Btn').textContent = '继续→';
      $('#aedEx1Btn').onclick = function() { showModPage(27,'AED'); initQuiz('aedEx2Quiz','aedEx2Fb','aedEx2Btn',10,function(){modScore.aedEx+=10;}); };
    });
    // Page 27-33: 单选Quiz
    $('#aedEx2Btn').onclick = function() { showModPage(28,'AED'); initQuiz('aedEx3Quiz','aedEx3Fb','aedEx3Btn',10,function(){modScore.aedEx+=10;}); };
    $('#aedEx3Btn').onclick = function() { showModPage(29,'AED'); initQuiz('aedEx4Quiz','aedEx4Fb','aedEx4Btn',15,function(){modScore.aedEx+=15;}); };
    $('#aedEx4Btn').onclick = function() { showModPage(30,'AED'); initQuiz('aedEx5Quiz','aedEx5Fb','aedEx5Btn',10,function(){modScore.aedEx+=10;}); };
    $('#aedEx5Btn').onclick = function() { showModPage(31,'AED'); initAedShock(); };
    function initAedShock() {
      try { $$('#aedEx6Checks input').forEach(function(cb){cb.checked=false}); $('#aedEx6Shock').style.display='none'; $('#aedEx6Ok').style.display='none'; $('#aedEx6Btn').style.display='none'; } catch(e) {}
      try { $('#aedEx6Checks').onchange = function() { var c=$('#aedEx6Checks').querySelectorAll('input:checked'); var ok=c.length>=4; var bad=Array.from(c).some(function(x){return x.value==='bad1'}); if(ok&&!bad){$('#aedEx6Shock').style.display='block';} }; } catch(e) {}
      $('#aedEx6Shock').onclick = function() { modScore.aedEx+=20; try { $('#aedEx6Shock').style.display='none'; $('#aedEx6Ok').style.display='block'; $('#aedEx6Btn').style.display='block'; Audio.shock(); } catch(e) {} };
    }
    $('#aedEx6Btn').onclick = function() { showModPage(32,'AED'); initQuiz('aedEx7Quiz','aedEx7Fb','aedEx7Btn',15,function(){modScore.aedEx+=15;}); };
    $('#aedEx7Btn').onclick = function() { showModPage(33,'AED训练完成'); showAedExReport(); };
  };

  function showAedExReport() {
    var attempts = window._aedAttempts || 1;
    var penalty = Math.min(20, (attempts - 1) * 5);
    var s = Math.max(0, modScore.aedEx - penalty);
    try { $('#aedExScore').textContent = s; } catch(e) {}
    if (attempts > 1) { try { $('#aedExScore').textContent += ' (第' + attempts + '次作答，扣' + penalty + '分)'; } catch(e) {} }
    var a = s>=80 ? '🏆杰出！你完全掌握了AED使用：<b>开机→贴片→分析→电击→CPR</b>。记住特殊情况的处理。' : s>=50 ? '👍良好！AED四步法记住了。复习电极片位置和电击后立即CPR的重要性。' : '📚需要加强。AED不复杂——它用语音指导你。多练几次就能自信使用。';
    try { $('#aedExAdvice').textContent = a; } catch(e) {}
    $('#aedExRetry').onclick = function() { window._startAed(); };
    $('#aedExHome').onclick = function() { goHome(); };
  }

  // ═══════════════ CHOKE EXPANDED (34-42) ═══════════════
  window._startChoke = function() {
    Audio.init(); modScore.chEx = 0;
    var intros = ['在<span class="highlight">餐厅</span>里，隔壁桌老人突然站起来双手抓住喉咙面色发紫。<b>这是气道梗阻！</b>','<span class="highlight">食堂</span>里学生吃鸡腿时突然咳嗽后声音消失脸色变紫。<b>他需要立即帮助！</b>','<span class="highlight">家庭聚餐</span>爷爷吃了年糕后说不出话。<b>你知道海姆立克法吗？</b>'];
    try { $('#chEx1Intro').innerHTML = intros[Math.floor(Math.random()*intros.length)]; } catch(e) {}
    showModPage(34, '气道梗阻急救');
    $('#chEx1Btn').onclick = function() { Audio.ding(); modScore.chEx+=10; showModPage(35,'气道梗阻'); initQuiz('chEx2Quiz','chEx2Fb','chEx2Btn',10,function(){modScore.chEx+=10;}); };
    $('#chEx2Btn').onclick = function() { showModPage(36,'气道梗阻'); initQuiz('chEx3Quiz','chEx3Fb','chEx3Btn',15,function(){modScore.chEx+=15;}); };
    $('#chEx3Btn').onclick = function() { showModPage(37,'气道梗阻');
      // Quiz 4a → on correct, chain to quiz 4b
      initQuiz('chEx4aQuiz','chEx4aFb','chEx4Btn',10,function(){
        modScore.chEx+=10;
        initQuiz('chEx4bQuiz','chEx4bFb','chEx4Btn',10,function(){
          modScore.chEx+=10;
          showModPage(38,'气道梗阻');
          initQuiz('chEx5Quiz','chEx5Fb','chEx5Btn',15,function(){modScore.chEx+=15;});
        });
      });
    };
    $('#chEx5Btn').onclick = function() { showModPage(39,'气道梗阻'); modScore.chEx+=10; };
    $('#chEx6Btn').onclick = function() { showModPage(40,'气道梗阻'); initQuiz('chEx7Quiz','chEx7Fb','chEx7Btn',10,function(){modScore.chEx+=10;}); };
    $('#chEx7Btn').onclick = function() { showModPage(41,'气道梗阻'); modScore.chEx+=10; };
    $('#chEx8Btn').onclick = function() { showModPage(42,'训练完成'); showChExReport(); };
  };

  function showChExReport() {
    var s = modScore.chEx;
    try { $('#chExScore').textContent = s; } catch(e) {}
    var a = s>=80 ? '🏆杰出！海姆立克法：<b>剪刀石头布→向内上冲击</b>。成人/孕妇/婴儿的差异你都掌握了。' : s>=50 ? '👍良好！记住口诀和不同人群的适应症。完全梗阻可能迅速造成严重缺氧——必须立即正确施救！' : '📚需要加强。海姆立克法是每人必学的救命技能。重点复习剪刀石头布定位法和冲击方向。';
    try { $('#chExAdvice').textContent = a; } catch(e) {}
    $('#chExRetry').onclick = function() { window._startChoke(); };
    $('#chExHome').onclick = function() { goHome(); };
  }

  // ═══════════════ TRAUMA EXPANDED (43-50) ═══════════════
  window._startTrauma = function() {
    Audio.init(); modScore.trEx = 0;
    var intros = ['你在<span class="highlight">建筑工地</span>附近，工人从高处摔落腿部流血。<b>首先要做什么？</b>','<span class="highlight">厨房里</span>家人切菜切到手指鲜血直流。<b>正确的止血方法？</b>','<span class="highlight">交通事故</span>电动车骑手摔倒在地手臂疑似骨折。<b>该如何处理？</b>'];
    try { $('#trEx1Intro').innerHTML = intros[Math.floor(Math.random()*intros.length)]; } catch(e) {}
    showModPage(43, '创伤急救基础');
    initQuiz('trEx1Quiz','trEx1Fb','trEx1Btn',10,function(){modScore.trEx+=10;});
    $('#trEx1Btn').onclick = function() { showModPage(44,'创伤急救'); initQuiz('trEx2Quiz','trEx2Fb','trEx2Btn',10,function(){modScore.trEx+=10;}); };
    $('#trEx2Btn').onclick = function() { showModPage(45,'创伤急救'); initQuiz('trEx3Quiz','trEx3Fb','trEx3Btn',15,function(){modScore.trEx+=15;}); };
    $('#trEx3Btn').onclick = function() { showModPage(46,'创伤急救'); modScore.trEx+=10; };
    $('#trEx4Btn').onclick = function() { showModPage(47,'创伤急救'); initQuiz('trEx5Quiz','trEx5Fb','trEx5Btn',10,function(){modScore.trEx+=10;}); };
    $('#trEx5Btn').onclick = function() { showModPage(48,'创伤急救'); modScore.trEx+=10; };
    $('#trEx6Btn').onclick = function() { showModPage(49,'创伤急救'); modScore.trEx+=10; };
    $('#trEx7Btn').onclick = function() { showModPage(50,'训练完成'); showTrExReport(); };
  };

  function showTrExReport() {
    var s = modScore.trEx;
    try { $('#trExScore').textContent = s; } catch(e) {}
    var a = s>=70 ? '🏆杰出！创伤急救：<b>安全→评估→止血→包扎→固定→搬运</b>。记住保己救人是第一原则。' : s>=40 ? '👍良好！核心流程记住了。直接压迫止血是最重要的技能——简单但能救命。' : '📚需要加强。记住DRABC评估法和止血优先原则。创伤急救中最常见也最危险的就是忘了自身安全。';
    try { $('#trExAdvice').textContent = a; } catch(e) {}
    $('#trExRetry').onclick = function() { window._startTrauma(); };
    $('#trExHome').onclick = function() { goHome(); };
  }

  // ─── Card handlers ───
  setTimeout(function() {
    try {
      var cards = $$('.module-card');
      if (cards[0]) { cards[0].onclick = function() { window._startTraining(); }; cards[0].style.cursor = 'pointer'; }
      // cards[1-3] 保留 HTML 中 onclick 的 _scrollToKnowledge 行为，不绑定 _startAed/_startChoke/_startTrauma
    } catch(e) {}
  }, 200);


  window._scorePanelInterval = setInterval(function() { try { var total=0; for(var k in state.scores){total+=state.scores[k]||0;} if(panelScore)panelScore.textContent=total; } catch(e) {} }, 2000);

  updateSidebar(1); updatePanel(1);
  // Dashboard + Expanded Modules (26 pages) active (dark mode toggle remains visible)
  // enterPage1 called by init() below
})();

function init() {
  // Load storage
  const stored = Storage.load();
  state.bestScore = stored.bestScore || 0;
  state.vibrationEnabled = stored.vibrationEnabled !== false;
  state.totalAttempts = stored.totalAttempts || 0;
  $('#vibrationToggle').checked = state.vibrationEnabled;
  $('#vibrationToggle2').checked = state.vibrationEnabled;

  // Dark mode init
  try {
    if (localStorage.getItem('cprDarkMode') === '1') {
      document.body.classList.add('dark');
      $('#darkToggle').textContent = '☀️';
    }
  } catch(e) {}

  // 点击弹窗空白区域关闭
  var overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) { overlay.classList.remove('active'); }
    });
  }

  // Build step indicator
  buildStepIndicator();

  // Init first page
  enterPage1();

  // Start press ECG loop (only runs when page 6 is active)
  var _ecgRaf = null;
  function ecgLoop() {
    if (state.currentPage === 6 && pressEcgRenderer) updatePressEcg();
    if (state.currentPage === 6) { _ecgRaf = requestAnimationFrame(ecgLoop); }
  }
  // Start loop on page 6, stop on other pages (auto restart via enterPage6)
  var _origEnter6 = enterPage6;
  enterPage6 = function() { _origEnter6(); if (!_ecgRaf) { _ecgRaf = requestAnimationFrame(ecgLoop); } };
  var _origStopComp = stopCompression;
  stopCompression = function() { if (_ecgRaf) { cancelAnimationFrame(_ecgRaf); _ecgRaf = null; } _origStopComp(); };

  // Hide loading
  setTimeout(() => {
    $('#app-loading').classList.add('hidden');
  }, 400);

  // Draw loading ECG
  const loadCanvas = $('#loadingEcg');
  if (loadCanvas) {
    const ctx = loadCanvas.getContext('2d');
    let off = 0;
    function drawLoad() {
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 200, 60);
      ctx.strokeStyle = '#e53935'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = 0; x < 200; x++) {
        const phase = ((x + off) % 120) / 120;
        let y = 30;
        if (phase > 0.45 && phase < 0.55) y = 30 - 25 * Math.exp(-Math.pow((phase - 0.5) * 40, 2));
        else if (phase > 0.05 && phase < 0.15) y = 30 - 6 * Math.sin((phase - 0.05) / 0.1 * Math.PI);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); off += 2;
      if ($('#app-loading').classList.contains('hidden')) return;
      requestAnimationFrame(drawLoad);
    }
    drawLoad();
  }

  // Push initial history
  try { window.history.pushState({ page: 1 }, '', '#page1'); } catch(e) {}
}

init();
// 敢救 · 急救情景训练与评估系统已就绪
// 12页主流程 | Web Audio音效 | 触觉反馈 | Canvas训练报告
// 零外部依赖 | 移动端优先 | 离线可运行

  // ===== PC WRAPPER COMMUNICATION =====
  window.addEventListener('message', function(e) {
    if (e.data && e.data.nav) {
      if (typeof goToPage === 'function') goToPage(e.data.nav);
    }
  });
  var _pcStep = 0, _pcScore = -1;
  window._pcWrapperInterval = setInterval(function() {
    try {
      var step = state.currentPage || 1;
      var t = 0, sc = state.scores || {};
      Object.values(sc).forEach(function(v) { t += v; });
      t += Math.max(0, 10 - Math.floor(Math.max(0, ((state.totalTime || 0) - 360) / 60)) * 2);
      t = Math.min(100, t);
      if (step !== _pcStep || t !== _pcScore) {
        _pcStep = step; _pcScore = t;
        window.parent.postMessage({ step: step, score: t }, '*');
      }
    } catch(e) {}
  }, 800);
})();

/* ══════ CPR Hotspot Debugger ══════ */
(function() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('debugHotspot') !== '1') return;
  function show() {
    var dbg = document.getElementById('cprHotspotDebugger');
    if (!dbg) return;
    dbg.classList.add('show');
    initHotspotDebugger();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();

function initHotspotDebugger() {
  var root = document.documentElement;
  var dbg = document.getElementById('cprHotspotDebugger');
  if (!dbg) return;
  var bindings = [
    {slider:'dbgLeft',valId:'dbgValL',varName:'--compression-hotspot-left',fmt:function(v){return v+'%';}},
    {slider:'dbgTop',valId:'dbgValT',varName:'--compression-hotspot-top',fmt:function(v){return v+'%';}},
    {slider:'dbgWidth',valId:'dbgValW',varName:'--compression-hotspot-width',fmt:function(v){return v+'px';}},
    {slider:'dbgHeight',valId:'dbgValH',varName:'--compression-hotspot-height',fmt:function(v){return v+'px';}},
  ];
  var objBindings = [
    {slider:'dbgObjX',valId:'dbgValOX',varName:'--cpr-obj-pos-x'},
    {slider:'dbgObjY',valId:'dbgValOY',varName:'--cpr-obj-pos-y'},
  ];
  var output = document.getElementById('dbgOutput');
  function getVal(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function updateOutput() {
    if (!output) return;
    output.textContent =
      '--compression-hotspot-left: '+getVal('--compression-hotspot-left')+';\n'+
      '--compression-hotspot-top: '+getVal('--compression-hotspot-top')+';\n'+
      '--compression-hotspot-width: '+getVal('--compression-hotspot-width')+';\n'+
      '--compression-hotspot-height: '+getVal('--compression-hotspot-height')+';\n'+
      'object-position: '+getVal('--cpr-obj-pos-x')+' '+getVal('--cpr-obj-pos-y')+';';
  }
  bindings.forEach(function(b) {
    var slider = document.getElementById(b.slider), valEl = document.getElementById(b.valId);
    if (!slider || !valEl) return;
    slider.addEventListener('input', function() {
      var v = parseInt(this.value, 10);
      valEl.textContent = b.fmt(v);
      root.style.setProperty(b.varName, b.fmt(v));
      updateOutput();
    });
  });
  objBindings.forEach(function(b) {
    var slider = document.getElementById(b.slider), valEl = document.getElementById(b.valId);
    if (!slider || !valEl) return;
    slider.addEventListener('input', function() {
      var v = this.value + '%';
      valEl.textContent = v;
      root.style.setProperty(b.varName, v);
      var img = document.getElementById('cprSceneImg');
      if (img) { if (b.varName === '--cpr-obj-pos-x') img.style.objectPositionX = v; else img.style.objectPositionY = v; }
      updateOutput();
    });
  });
  updateOutput();
  var copyBtn = document.getElementById('dbgCopy');
  if (copyBtn) copyBtn.onclick = function() {
    var text = output.textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function(){copyBtn.textContent='✅ 已复制';setTimeout(function(){copyBtn.textContent='📋 复制参数';},1500);});
    else { var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);copyBtn.textContent='✅ 已复制';setTimeout(function(){copyBtn.textContent='📋 复制参数';},1500); }
  };
  var hideBtn = document.getElementById('dbgHide');
  if (hideBtn) hideBtn.onclick = function() { dbg.classList.remove('show'); };
}

(function(){
  var guideBtn=document.getElementById("headerGuideBtn");
  var panel=document.getElementById("mobileGuidePanel");
  var overlay=document.getElementById("mobileGuideOverlay");
  var close=document.getElementById("mobilePanelClose");
  function openPanel(){if(panel)panel.classList.add("show");if(overlay)overlay.classList.add("show");}
  function closePanel(){if(panel)panel.classList.remove("show");if(overlay)overlay.classList.remove("show");}
  if(guideBtn)guideBtn.addEventListener("click",openPanel);
  if(close)close.addEventListener("click",closePanel);
  if(overlay)overlay.addEventListener("click",closePanel);
})();
