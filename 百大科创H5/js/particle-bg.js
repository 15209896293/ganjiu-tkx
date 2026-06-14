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
