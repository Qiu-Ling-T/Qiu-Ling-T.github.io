(function () {
  'use strict';

  var tabs = document.querySelectorAll('.cat-tab');
  var cards = document.querySelectorAll('.post-card');
  var empty = document.getElementById('posts-empty');
  if (!tabs.length || !cards.length) return;

  function apply(cat) {
    var shown = 0;
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.cat === cat);
    });
    cards.forEach(function (card) {
      var cats = (card.getAttribute('data-categories') || '').split('|').filter(Boolean);
      var show = cat === 'all' || cats.indexOf(cat) !== -1;
      card.style.display = show ? '' : 'none';
      if (show) shown++;
    });
    if (empty) empty.style.display = shown ? 'none' : 'block';
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      apply(t.dataset.cat);
    });
  });
})();
