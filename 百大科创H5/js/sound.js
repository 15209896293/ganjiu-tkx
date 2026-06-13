/* ============================================================
   百大科创 H5 —— 音效系统：Web Audio API 合成音效
   零音频文件，纯振荡器合成
   ============================================================ */

var SoundFx = (function () {
  'use strict';

  var ctx = null;

  // 懒加载 AudioContext（用户首次交互后创建，符合浏览器策略）
  function getCtx() {
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    // 恢复被暂停的上下文（某些浏览器需要）
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  /** 播放一个频率的音调 */
  function tone(freq, startTime, duration, opts) {
    var c = getCtx();
    if (!c) return;

    opts = opts || {};
    var type = opts.type || 'sine';
    var gain = opts.gain !== undefined ? opts.gain : 0.25;
    var detune = opts.detune || 0;

    var osc = c.createOscillator();
    var gainNode = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (detune) osc.detune.setValueAtTime(detune, startTime);

    gainNode.gain.setValueAtTime(gain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(c.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /** 答题正确 —— 叮咚声（上行双音） */
  function playCorrect() {
    var c = getCtx();
    if (!c) return;
    var t = c.currentTime;
    tone(523, t,       0.12, { type: 'sine', gain: 0.3 });       // C5
    tone(659, t + 0.10, 0.18, { type: 'sine', gain: 0.28 });      // E5
    tone(784, t + 0.20, 0.22, { type: 'sine', gain: 0.22 });      // G5 泛音
  }

  /** 答题错误 —— 轻柔提示音（低音短促） */
  function playWrong() {
    var c = getCtx();
    if (!c) return;
    var t = c.currentTime;
    tone(200, t,       0.25, { type: 'triangle', gain: 0.18 });
    tone(180, t + 0.08, 0.20, { type: 'triangle', gain: 0.14 });
  }

  /** 徽章解锁 —— 庆祝上行琶音 */
  function playBadge() {
    var c = getCtx();
    if (!c) return;
    var t = c.currentTime;
    var notes = [523, 659, 784, 1047]; // C5→E5→G5→C6
    for (var i = 0; i < notes.length; i++) {
      tone(notes[i], t + i * 0.08, 0.20, { type: 'sine', gain: 0.22 });
    }
    // 末尾洒花（高频泛音）
    tone(1319, t + 0.36, 0.30, { type: 'sine', gain: 0.12 });
  }

  /** 通关 —— 升级音效（长音阶 + 结尾和弦） */
  function playComplete() {
    var c = getCtx();
    if (!c) return;
    var t = c.currentTime;
    var scale = [392, 440, 523, 587, 659, 784, 880, 1047]; // G4→C6
    for (var i = 0; i < scale.length; i++) {
      tone(scale[i], t + i * 0.07, 0.14, { type: 'sine', gain: 0.20 });
    }
    // 结尾和弦（C大三和弦）
    var chordT = t + scale.length * 0.07;
    tone(523,  chordT, 0.50, { type: 'sine', gain: 0.22 });  // C5
    tone(659,  chordT, 0.50, { type: 'sine', gain: 0.18 });  // E5
    tone(784,  chordT, 0.50, { type: 'sine', gain: 0.15 });  // G5
    tone(1047, chordT, 0.60, { type: 'sine', gain: 0.12 });  // C6
  }

  /** 通用播放入口 */
  function play(type) {
    switch (type) {
      case 'correct':  playCorrect();  break;
      case 'wrong':    playWrong();    break;
      case 'badge':    playBadge();    break;
      case 'complete': playComplete(); break;
      default: break;
    }
  }

  // 暴露 API
  return { play: play };
})();
