(function () {
  'use strict';

  // ---------- 顶部栏滚动阴影 ----------
  var header = document.getElementById('header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- 搜索 ----------
  var input = document.getElementById('search-input');
  var resultsBox = document.getElementById('search-results');
  if (!input || !resultsBox) return;

  var index = null;
  var fetching = null;

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (fetching) return fetching;
    fetching = fetch(searchJsonPath())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data.posts || [];
        return index;
      })
      .catch(function () {
        index = [];
        return index;
      });
    return fetching;
  }

  function searchJsonPath() {
    var base = document.querySelector('base');
    var root = (typeof ROOT !== 'undefined' && ROOT) || '';
    return root + 'search.json';
  }

  function render(ch) {
    var kw = ch.toLowerCase().trim();
    if (!kw) {
      resultsBox.classList.remove('show');
      resultsBox.innerHTML = '';
      return;
    }
    var hits = index.filter(function (p) {
      return p.title.toLowerCase().indexOf(kw) !== -1 ||
        (p.content && p.content.toLowerCase().indexOf(kw) !== -1) ||
        (p.tags || []).join(' ').toLowerCase().indexOf(kw) !== -1;
    }).slice(0, 8);

    if (!hits.length) {
      resultsBox.innerHTML = '<div class="search-empty">没有找到相关文章</div>';
      resultsBox.classList.add('show');
      return;
    }
    resultsBox.innerHTML = hits.map(function (p) {
      var r = ROOT || '';
      return '<a class="search-item" href="' + r + p.url + '">' +
        '<span class="search-item-title"></span>' +
        '<span class="search-item-date">' + (p.date || '') + '</span>' +
        '</a>';
    }).join('');
    // 填充标题（避免 HTML 注入）
    var items = resultsBox.querySelectorAll('.search-item');
    hits.forEach(function (p, i) {
      items[i].querySelector('.search-item-title').textContent = p.title;
    });
    resultsBox.classList.add('show');
  }

  var t = null;
  input.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      loadIndex().then(function () { render(input.value); });
    }, 120);
  });

  input.addEventListener('focus', function () {
    if (index && input.value) render(input.value);
  });

  document.addEventListener('click', function (e) {
    if (!resultsBox.contains(e.target) && e.target !== input) {
      resultsBox.classList.remove('show');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      resultsBox.classList.remove('show');
      input.blur();
    }
  });
})();