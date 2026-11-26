(function () {
  if (typeof window === 'undefined') return;
  window.mountWhiteRabbitGetCourse = function (mount, status) {
    if (!mount || mount.dataset.checkoutEnabled !== 'true' || mount.dataset.initialized) return;
    if (mount.dataset.registrationMode === 'preview'
      && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return;
    if (!['preview', 'live'].includes(mount.dataset.registrationMode)) return;
    var widgetId = mount.dataset.widgetId || '';
    var id = mount.dataset.scriptElementId || '';
    if (!/^\d+$/.test(widgetId) || !/^[a-zA-Z0-9_-]+$/.test(id)) return;
    mount.dataset.initialized = 'true';
    var script = document.createElement('script');
    script.id = id;
    var active = true;
    var startName = 'startWidget' + id;
    // The supplied GetCourse script exposes this initializer and removes its own
    // script tag. Re-dispatching StartWidget accumulates vendor listeners on
    // remount and tries to remove that tag twice. Load once, call once per mount.
    var start = function () {
      if (!active || document.getElementById(id) !== script) return;
      if (typeof window[startName] === 'function') window[startName]();
      else if (status) status.textContent = 'Не удалось открыть форму. Обновите страницу или используйте ссылку ниже.';
    };
    var cached = typeof window[startName] === 'function';
    if (!cached) script.src = 'https://tarotroad.getcourse.ru/pl/lite/widget/script?id=' + widgetId;
    script.onload = start;
    script.onerror = function () {
      if (status) status.textContent = 'Не удалось загрузить форму. Проверьте подключение и обновите страницу.';
    };
    var loadingTimeout = window.setTimeout(function () {
      if (status && !status.hidden) status.textContent = 'Форма загружается дольше обычного. Можно открыть её по ссылке ниже.';
    }, 15000);
    var observer = new MutationObserver(function () {
      var frame = mount.querySelector('iframe');
      if (!frame) return;
      if (!frame.title) frame.title = 'GetCourse — оформление участия и переход к оплате';
      if (parseFloat(frame.style.height) > 0) {
        if (status) status.hidden = true;
        window.clearTimeout(loadingTimeout);
        observer.disconnect();
      }
    });
    observer.observe(mount, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    mount.appendChild(script);
    if (cached) start();
    return function () {
      active = false;
      window.clearTimeout(loadingTimeout);
      observer.disconnect();
      script.onload = null;
      script.onerror = null;
      mount.replaceChildren();
      delete mount.dataset.initialized;
    };
  };
})();
