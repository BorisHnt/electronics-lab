(function () {
  var body = document.body;
  var menuToggle = document.querySelector('.menu-toggle');
  var navOverlay = document.querySelector('.nav-overlay');
  var focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var previousFocus = null;

  function getCurrentFile() {
    var pathname = window.location.pathname;
    var cleanedPath = pathname.replace(/\/+$/, '');
    var lastSegment = cleanedPath.split('/').pop();

    if (!lastSegment || lastSegment.indexOf('.') === -1) {
      return 'index.html';
    }

    return lastSegment;
  }

  function isOutilsContext(file) {
    return file === 'outils.html' || file === 'loi-ohm.html' || file === 'couleurs-resistance.html';
  }

  function applyActiveMenuState() {
    var currentFile = getCurrentFile();
    var toolsContext = isOutilsContext(currentFile);
    var topLevelMap = {
      'index.html': 'index',
      'modules.html': 'modules',
      'outils.html': 'outils',
      'ressources.html': 'ressources',
      'a-propos.html': 'a-propos',
      'loi-ohm.html': 'outils',
      'couleurs-resistance.html': 'outils'
    };

    body.classList.toggle('is-outils-context', toolsContext);

    document.querySelectorAll('.nav-submenu').forEach(function (submenu) {
      submenu.hidden = !toolsContext;
    });

    document.querySelectorAll('.nav-item, .nav-subitem').forEach(function (item) {
      item.classList.remove('is-active');
      item.removeAttribute('aria-current');
    });

    var currentTop = topLevelMap[currentFile] || 'index';
    var activeTop = document.querySelector('.nav-item[data-nav="' + currentTop + '"]');
    if (activeTop) {
      activeTop.classList.add('is-active');
      if (!toolsContext || currentFile === 'outils.html') {
        activeTop.setAttribute('aria-current', 'page');
      }
    }

    if (currentFile === 'loi-ohm.html' || currentFile === 'couleurs-resistance.html') {
      var activeSub = document.querySelector('.nav-subitem[data-nav="' + currentFile.replace('.html', '') + '"]');
      if (activeSub) {
        activeSub.classList.add('is-active');
        activeSub.setAttribute('aria-current', 'page');
      }
    }
  }

  function openMenu() {
    if (!menuToggle || !navOverlay) {
      return;
    }

    previousFocus = document.activeElement;
    navOverlay.classList.add('is-open');
    navOverlay.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.textContent = 'FERMER';
    body.classList.add('menu-open');

    var firstFocusable = navOverlay.querySelector(focusableSelectors);
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  function closeMenu() {
    if (!menuToggle || !navOverlay) {
      return;
    }

    navOverlay.classList.remove('is-open');
    navOverlay.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = 'MENU';
    body.classList.remove('menu-open');

    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    } else {
      menuToggle.focus();
    }
  }

  function trapFocus(event) {
    if (!navOverlay || !navOverlay.classList.contains('is-open') || event.key !== 'Tab') {
      return;
    }

    var focusable = Array.prototype.slice
      .call(navOverlay.querySelectorAll(focusableSelectors))
      .filter(function (element) {
        return element.offsetParent !== null || element === document.activeElement;
      });

    if (focusable.length === 0) {
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setupMenu() {
    if (!menuToggle || !navOverlay) {
      return;
    }

    menuToggle.addEventListener('click', function () {
      var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navOverlay.classList.contains('is-open')) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', trapFocus);

    navOverlay.addEventListener('click', function (event) {
      if (event.target === navOverlay) {
        closeMenu();
        return;
      }

      if (event.target.closest('.nav-item, .nav-subitem')) {
        closeMenu();
      }
    });
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return null;
    }

    var rounded = Math.round(value * 1000) / 1000;
    return rounded.toString();
  }

  function setupOhmCalculator() {
    var form = document.getElementById('ohm-form');
    var result = document.getElementById('ohm-result');
    var resetButton = document.getElementById('ohm-reset');

    if (!form || !result) {
      return;
    }

    var voltage = document.getElementById('voltage');
    var current = document.getElementById('current');
    var resistance = document.getElementById('resistance');

    function toNumber(input) {
      if (!input.value.trim()) {
        return null;
      }
      return Number(input.value);
    }

    function setResult(message, isError) {
      result.textContent = message;
      result.classList.toggle('is-error', Boolean(isError));
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var v = toNumber(voltage);
      var i = toNumber(current);
      var r = toNumber(resistance);
      var values = [v, i, r];
      var emptyCount = values.filter(function (value) {
        return value === null;
      }).length;

      if (values.some(function (value) { return value !== null && (!Number.isFinite(value) || value < 0); })) {
        setResult('Utilisez uniquement des nombres positifs.', true);
        return;
      }

      if (emptyCount !== 1) {
        setResult('Laissez exactement un champ vide pour calculer la grandeur manquante.', true);
        return;
      }

      if (v === null && i !== null && r !== null) {
        v = i * r;
        voltage.value = formatNumber(v);
        setResult('Tension calculee: ' + formatNumber(v) + ' V', false);
        return;
      }

      if (i === null && v !== null && r !== null) {
        if (r === 0) {
          setResult('La resistance doit etre superieure a 0 pour calculer le courant.', true);
          return;
        }
        i = v / r;
        current.value = formatNumber(i);
        setResult('Courant calcule: ' + formatNumber(i) + ' A', false);
        return;
      }

      if (r === null && v !== null && i !== null) {
        if (i === 0) {
          setResult('Le courant doit etre superieur a 0 pour calculer la resistance.', true);
          return;
        }
        r = v / i;
        resistance.value = formatNumber(r);
        setResult('Resistance calculee: ' + formatNumber(r) + ' Ohm', false);
      }
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        form.reset();
        setResult('Le resultat apparaitra ici.', false);
      });
    }
  }

  applyActiveMenuState();
  setupMenu();
  setupOhmCalculator();
})();
