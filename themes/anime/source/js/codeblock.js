/* 代码块增强：左上角语言标签 + 右上角复制按钮
   样式在 themes/anime/source/css/style.css 的 .code-lang / .code-copy */
(function () {
  'use strict';

  // 用内联 SVG，避免依赖 Font Awesome 的 CDN
  var COPY_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"></rect><path d="M5 15V5.5A2.5 2.5 0 0 1 7.5 3H15"></path></svg>';
  var DONE_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"></path></svg>';

  function langName(figure) {
    var classes = (figure.className || '').split(/\s+/).filter(function (name) {
      return name && name !== 'highlight';
    });
    return classes.length ? classes[0] : 'text';
  }

  function codeText(figure) {
    var pre = figure.querySelector('td.code pre') || figure.querySelector('pre');
    return pre ? pre.textContent.replace(/\n$/, '') : '';
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function onCopied(button) {
    button.innerHTML = DONE_ICON;
    button.classList.add('copied');
    button.title = '已复制';
    setTimeout(function () {
      button.innerHTML = COPY_ICON;
      button.classList.remove('copied');
      button.title = '复制代码';
    }, 1600);
  }

  document.querySelectorAll('figure.highlight').forEach(function (figure) {
    var label = document.createElement('span');
    label.className = 'code-lang';
    label.textContent = langName(figure);
    figure.appendChild(label);

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.title = '复制代码';
    button.setAttribute('aria-label', '复制代码');
    button.innerHTML = COPY_ICON;
    figure.appendChild(button);

    button.addEventListener('click', function () {
      var text = codeText(figure);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { onCopied(button); },
          function () { if (fallbackCopy(text)) onCopied(button); });
      } else if (fallbackCopy(text)) {
        onCopied(button);
      }
    });
  });
})();