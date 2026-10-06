(function () {
  var mount = document.getElementById('getcourse-order');
  if (!mount || mount.dataset.initialized) return;
  mount.dataset.initialized = 'true';
  var status = document.getElementById('order-status');
  var id = '5a679e9fefe08748f764b61cd3cb57ac4fb8c030';
  var script = document.createElement('script');
  script.id = id;
  script.src = 'https://tarotroad.getcourse.ru/pl/lite/widget/script?id=1665193';
  script.onload = function () {
    // GetCourse exposes this event for scripts loaded after DOMContentLoaded.
    if (document.readyState !== 'loading' && document.getElementById(id)) {
      document.dispatchEvent(new Event('StartWidget' + id));
    }
  };
  script.onerror = function () {
    if (status) status.textContent = 'Не удалось загрузить форму. Проверьте подключение к интернету и обновите страницу.';
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
})();
