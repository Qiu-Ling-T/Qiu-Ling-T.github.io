(function () {
  'use strict';

  var tocCard = document.getElementById('toc-card');
  var content = document.querySelector('.post-content .markdown-body, .page-card .markdown-body');
  if (!tocCard || !content) return;

  var links = tocCard.querySelectorAll('a.toc-link');
  if (!links.length) {
    tocCard.style.display = 'none';
    return;
  }

  // 点击平滑滚动
  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = decodeURIComponent((link.getAttribute('href') || '').slice(1));
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });

  // 滚动高亮当前位置
  // 注意：标题的 offsetTop 是相对 .post-content 的（backdrop-filter 会形成 containing block），
  // 不能直接和 window.scrollY 比较，必须动态换算成文档绝对坐标
  var ids = [];
  content.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function (h) {
    if (h.id) ids.push(h.id);
  });

  function headingTop(id) {
    var el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
  }

  var current = null;
  function onScroll() {
    var fromTop = window.scrollY;
    var best = null;
    ids.forEach(function (id) {
      if (headingTop(id) - 90 <= fromTop) best = id;
    });
    if (!best || best === current) return;
    current = best;
    links.forEach(function (l) { l.classList.remove('active'); });
    var activeLink = tocCard.querySelector('a[href="#' + current + '"]');
    if (activeLink) activeLink.classList.add('active');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 移动端：目录收进卡片，滚动跟随
  if (window.innerWidth < 900) {
    tocCard.classList.add('collapsed');
    tocCard.addEventListener('click', function () {
      tocCard.classList.toggle('collapsed');
    });
  }
})();