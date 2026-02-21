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
      'theorie.html': 'theorie',
      'outils.html': 'outils',
      'ressources.html': 'ressources',
      'securite-atelier.html': 'ressources',
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
        setResult('Tension calculée : ' + formatNumber(v) + ' V', false);
        return;
      }

      if (i === null && v !== null && r !== null) {
        if (r === 0) {
          setResult('La résistance doit être supérieure à 0 pour calculer le courant.', true);
          return;
        }
        i = v / r;
        current.value = formatNumber(i);
        setResult('Courant calculé : ' + formatNumber(i) + ' A', false);
        return;
      }

      if (r === null && v !== null && i !== null) {
        if (i === 0) {
          setResult('Le courant doit être supérieur à 0 pour calculer la résistance.', true);
          return;
        }
        r = v / i;
        resistance.value = formatNumber(r);
        setResult('Résistance calculée : ' + formatNumber(r) + ' Ohm', false);
      }
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        form.reset();
        setResult('Le résultat apparaîtra ici.', false);
      });
    }
  }

  function setupResistorColorCalculator() {
    var form = document.getElementById('resistor-color-form');
    if (!form) {
      return;
    }

    var bandCount = document.getElementById('band-count');
    var band1Select = document.getElementById('band1-select');
    var band2Select = document.getElementById('band2-select');
    var band3Select = document.getElementById('band3-select');
    var multiplierSelect = document.getElementById('multiplier-select');
    var toleranceSelect = document.getElementById('tolerance-select');
    var band3Field = document.getElementById('band3-field');
    var resetButton = document.getElementById('resistor-reset');
    var result = document.getElementById('resistor-result');

    var band1Preview = document.getElementById('band1-preview');
    var band2Preview = document.getElementById('band2-preview');
    var band3Preview = document.getElementById('band3-preview');
    var multiplierPreview = document.getElementById('multiplier-preview');
    var tolerancePreview = document.getElementById('tolerance-preview');

    var band1Visual = document.querySelector('.band-digit1');
    var band2Visual = document.querySelector('.band-digit2');
    var band3Visual = document.querySelector('.band-digit3');
    var multiplierVisual = document.querySelector('.band-multiplier');
    var toleranceVisual = document.querySelector('.band-tolerance');

    var colorData = {
      black: { label: 'Noir', digit: 0, multiplier: 1 },
      brown: { label: 'Marron', digit: 1, multiplier: 10, tolerance: 1 },
      red: { label: 'Rouge', digit: 2, multiplier: 100, tolerance: 2 },
      orange: { label: 'Orange', digit: 3, multiplier: 1000 },
      yellow: { label: 'Jaune', digit: 4, multiplier: 10000 },
      green: { label: 'Vert', digit: 5, multiplier: 100000, tolerance: 0.5 },
      blue: { label: 'Bleu', digit: 6, multiplier: 1000000, tolerance: 0.25 },
      violet: { label: 'Violet', digit: 7, multiplier: 10000000, tolerance: 0.1 },
      gray: { label: 'Gris', digit: 8, multiplier: 100000000, tolerance: 0.05 },
      white: { label: 'Blanc', digit: 9, multiplier: 1000000000 },
      gold: { label: 'Or', multiplier: 0.1, tolerance: 5 },
      silver: { label: 'Argent', multiplier: 0.01, tolerance: 10 },
      none: { label: 'Aucune', tolerance: 20 }
    };

    var digitKeys = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];
    var multiplierKeys = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'gold', 'silver'];
    var toleranceKeys = ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none'];
    var defaults = {
      bandCount: '4',
      band1: 'brown',
      band2: 'black',
      band3: 'black',
      multiplier: 'red',
      tolerance: 'gold'
    };

    function clearColorClasses(element) {
      if (!element) {
        return;
      }
      element.className = element.className
        .split(' ')
        .filter(function (className) {
          return className.indexOf('color-') !== 0;
        })
        .join(' ');
    }

    function applyColorClass(element, key) {
      if (!element) {
        return;
      }
      clearColorClasses(element);
      element.classList.add('color-' + key);
    }

    function trimNumber(value) {
      var rounded = Math.round(value * 1000) / 1000;
      return String(rounded)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0+$/, '$1');
    }

    function formatResistance(ohms) {
      if (ohms >= 1000000000) {
        return trimNumber(ohms / 1000000000) + ' GOhm';
      }
      if (ohms >= 1000000) {
        return trimNumber(ohms / 1000000) + ' MOhm';
      }
      if (ohms >= 1000) {
        return trimNumber(ohms / 1000) + ' kOhm';
      }
      return trimNumber(ohms) + ' Ohm';
    }

    function createOption(key, text) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = text;
      return option;
    }

    function populateSelect(select, keys, makeText) {
      if (!select) {
        return;
      }
      select.innerHTML = '';
      keys.forEach(function (key) {
        select.appendChild(createOption(key, makeText(colorData[key])));
      });
    }

    function toggleBandCountUI() {
      var isFiveBands = bandCount.value === '5';
      form.classList.toggle('is-five-band', isFiveBands);
      form.classList.toggle('is-four-band', !isFiveBands);
      band3Field.hidden = !isFiveBands;
      if (band3Visual) {
        band3Visual.classList.toggle('is-hidden', !isFiveBands);
      }
    }

    function updateVisuals() {
      applyColorClass(band1Preview, band1Select.value);
      applyColorClass(band2Preview, band2Select.value);
      applyColorClass(band3Preview, band3Select.value);
      applyColorClass(multiplierPreview, multiplierSelect.value);
      applyColorClass(tolerancePreview, toleranceSelect.value);

      applyColorClass(band1Visual, band1Select.value);
      applyColorClass(band2Visual, band2Select.value);
      applyColorClass(band3Visual, band3Select.value);
      applyColorClass(multiplierVisual, multiplierSelect.value);
      applyColorClass(toleranceVisual, toleranceSelect.value);
    }

    function calculateResistance() {
      var isFiveBands = bandCount.value === '5';
      var digit1 = colorData[band1Select.value];
      var digit2 = colorData[band2Select.value];
      var digit3 = colorData[band3Select.value];
      var multiplier = colorData[multiplierSelect.value];
      var tolerance = colorData[toleranceSelect.value];

      var significant = isFiveBands
        ? (digit1.digit * 100 + digit2.digit * 10 + digit3.digit)
        : (digit1.digit * 10 + digit2.digit);
      var resistance = significant * multiplier.multiplier;
      var toleranceValue = tolerance.tolerance;

      result.classList.remove('is-error');
      result.textContent = 'Valeur : ' + formatResistance(resistance) + ' ±' + toleranceValue + '%';
    }

    function refresh() {
      toggleBandCountUI();
      updateVisuals();
      calculateResistance();
    }

    populateSelect(band1Select, digitKeys, function (meta) {
      return meta.label + ' (' + meta.digit + ')';
    });
    populateSelect(band2Select, digitKeys, function (meta) {
      return meta.label + ' (' + meta.digit + ')';
    });
    populateSelect(band3Select, digitKeys, function (meta) {
      return meta.label + ' (' + meta.digit + ')';
    });
    populateSelect(multiplierSelect, multiplierKeys, function (meta) {
      return meta.label + ' (x' + trimNumber(meta.multiplier) + ')';
    });
    populateSelect(toleranceSelect, toleranceKeys, function (meta) {
      return meta.label + ' (±' + meta.tolerance + '%)';
    });

    bandCount.value = defaults.bandCount;
    band1Select.value = defaults.band1;
    band2Select.value = defaults.band2;
    band3Select.value = defaults.band3;
    multiplierSelect.value = defaults.multiplier;
    toleranceSelect.value = defaults.tolerance;
    refresh();

    form.addEventListener('change', refresh);

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        bandCount.value = defaults.bandCount;
        band1Select.value = defaults.band1;
        band2Select.value = defaults.band2;
        band3Select.value = defaults.band3;
        multiplierSelect.value = defaults.multiplier;
        toleranceSelect.value = defaults.tolerance;
        refresh();
      });
    }
  }

  applyActiveMenuState();
  setupMenu();
  setupOhmCalculator();
  setupResistorColorCalculator();
})();
