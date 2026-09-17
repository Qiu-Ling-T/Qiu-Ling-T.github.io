(function () {
  'use strict';

  // ---------- 随机句子 ----------
  var quote = document.getElementById('hero-quote');
  if (quote && window.ANIME && window.ANIME.sentences && window.ANIME.sentences.length) {
    var list = window.ANIME.sentences;
    quote.textContent = list[Math.floor(Math.random() * list.length)];
  }

  // ---------- 向下箭头 + 滚轮吸附滚动 ----------
  var heroScroll = document.getElementById('hero-scroll');
  var postsSec = document.getElementById('posts');
  var postsTop = 0;
  function measure() {
    postsTop = postsSec ? postsSec.getBoundingClientRect().top + window.scrollY : 0;
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lock = false;
  function snapTo(top) {
    lock = true;
    window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    clearTimeout(snapTo._t);
    snapTo._t = setTimeout(function () { lock = false; }, 750);
  }
  if (heroScroll) {
    heroScroll.addEventListener('click', function (e) {
      e.preventDefault();
      snapTo(postsTop);
    });
  }
  window.addEventListener('wheel', function (e) {
    if (lock) return;
    var y = window.scrollY;
    if (e.deltaY > 0 && y < postsTop * 0.8) {
      // 在首页 hero 区域往下滚 -> 直接到文章目录
      e.preventDefault();
      snapTo(postsTop);
    } else if (e.deltaY < 0 && y > 0 && y <= postsTop + 80) {
      // 在目录顶端往上滚 -> 直接回最顶部
      e.preventDefault();
      snapTo(0);
    }
  }, { passive: false });

  // ---------- 樱花花瓣粒子 ----------
  var canvas = document.getElementById('hero-petals');
  if (!canvas || (window.ANIME && !window.ANIME.petals.enable)) return;

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var petals = [];
  var cfg = window.ANIME.petals;
  // 颜色在白色(255,255,255)与樱花粉(255,192,248)之间插值
  var c1 = (cfg.color1 || '255,255,255').split(',').map(Number);
  var c2 = (cfg.color2 || '255,192,248').split(',').map(Number);
  var MAX = cfg.maxCount || 120;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawn(randomY) {
    petals.push({
      x: rand(0, canvas.width),
      y: randomY ? rand(-canvas.height * 0.3, 0) : rand(-canvas.height * 0.9, -canvas.height * 0.1),
      size: rand(9, 20),
      vy: rand(28, 65) * (canvas.height / 900),   // 下落速度，随视口微调
      swayAmp: rand(15, 60),
      swayFreq: rand(0.5, 1.4),
      offset: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      vr: rand(-2.2, 2.2),
      drift: rand(-0.6, -0.1),
      life: rand(8, 10),
      age: 0,
      t: Math.random(),                            // 颜色插值系数
      alphaMul: rand(0.6, 1)
    });
  }

  function reset() {
    canvas.width = canvas.height = 0;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  reset();
  window.addEventListener('resize', function () {
    reset();
    var ratio = canvas.height / 900;
    petals.forEach(function (p) {
      var d = rand(28, 65) * ratio;
      p.vy = d;
    });
  });

  function petalColor(t) {
    var scale = function (a, b) { return Math.round(a + (b - a) * t); };
    return 'rgb(' + scale(c1[0], c2[0]) + ',' + scale(c1[1], c2[1]) + ',' + scale(c1[2], c2[2]) + ')';
  }

  function drawPetal(s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s);
    ctx.lineTo(0, -s * 0.82);
    ctx.lineTo(s * 0.5, -s);
    ctx.bezierCurveTo(s * 1.15, -s * 0.55, s * 1.05, s * 0.25, 0, s);
    ctx.bezierCurveTo(-s * 1.05, s * 0.25, -s * 1.15, -s * 0.55, -s * 0.5, -s);
    ctx.closePath();
  }

  function frame() {
    // 出生粒子
    var want = Math.min(petals.length + (prefersReduced ? 0 : 2), MAX);
    while (petals.length < want) spawn(false);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = petals.length - 1; i >= 0; i--) {
      var p = petals[i];
      p.age += 1 / 60;
      // alpha：淡入 10%，淡出最后 60%
      var a = Math.min(p.age / (p.life * 0.1), 1);
      a *= Math.max(0, 1 - (p.age - p.life * 0.4) / (p.life * 0.6));
      if (p.age >= p.life || p.y > canvas.height + 60) {
        petals.splice(i, 1);
        continue;
      }
      p.rot += p.vr / 60;
      p.x += p.drift + (Math.sin(p.age * p.swayFreq + p.offset) * 0.5);
      p.y += p.vy / 60;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, a * p.alphaMul));
      ctx.fillStyle = petalColor(p.t);
      ctx.fill(drawPetal(p.size));
      ctx.restore();
    }
    if (!prefersReduced) requestAnimationFrame(frame);
  }
  frame();
})();