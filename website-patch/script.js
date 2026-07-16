/* Urban Eye by Brooks & Co. — interactions */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (selector, context) { return (context || document).querySelector(selector); };
  var $$ = function (selector, context) { return Array.prototype.slice.call((context || document).querySelectorAll(selector)); };

  /* Current year */
  $$('[data-year]').forEach(function (node) {
    node.textContent = new Date().getFullYear();
  });

  /* Hero video with poster and reduced-motion fallback */
  var heroVideo = $('[data-hero-video]');
  if (heroVideo) {
    var disableHeroVideo = function () {
      heroVideo.pause();
      heroVideo.classList.add('video-unavailable');
    };

    heroVideo.addEventListener('error', disableHeroVideo);
    heroVideo.querySelectorAll('source').forEach(function (source) {
      source.addEventListener('error', function () {
        if (heroVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
          disableHeroVideo();
        }
      });
    });

    if (reduceMotion) {
      disableHeroVideo();
    } else {
      var playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          /* The poster remains visible when autoplay is blocked. */
        });
      }
    }
  }

  /* Header */
  var header = $('[data-header]');
  if (header) {
    var updateHeader = function () {
      header.classList.toggle('stuck', window.scrollY > 24);
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* Mobile navigation */
  var menuButton = $('[data-menu-button]');
  var menu = $('[data-menu]');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      menuButton.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        menuButton.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* Reveal */
  var revealItems = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index % 4, 3) * 0.055 + 's';
      revealObserver.observe(item);
    });
  }

  /* Business scale switcher */
  var scaleData = {
    small: {
      label: 'Starting out',
      title: 'Start with a focused service that creates immediate clarity.',
      copy: 'Start with the free Business Modernization Blueprint, then a targeted page improvement or a compact website project to solve the most important problem first.',
      list: ['Low-risk first engagement', 'Clear boundaries and deliverables', 'Practical next-step recommendation', 'Future work quoted only when needed']
    },
    growth: {
      label: 'Growing',
      title: 'Add strategy, design and implementation as the business is ready to use them.',
      copy: 'A growing company can move from diagnosis into stronger content, custom pages, conversion improvements, campaigns and ongoing support.',
      list: ['Custom scope instead of a fixed package', 'Build the highest-value pieces first', 'Expand through repeat work', 'Support can grow with the budget']
    },
    enterprise: {
      label: 'Complex',
      title: 'Bring in deeper architecture, governance and specialists when complexity requires them.',
      copy: 'Larger companies may need stakeholder discovery, design systems, migration, integrations, catalog work and ongoing optimization.',
      list: ['Stakeholder and system discovery', 'Governed design and content systems', 'Specialist-supported implementation', 'Quote based on actual complexity']
    }
  };

  var scaleSwitcher = $('[data-scale-switcher]');
  if (scaleSwitcher) {
    var label = $('[data-scale-label]', scaleSwitcher);
    var title = $('[data-scale-title]', scaleSwitcher);
    var copy = $('[data-scale-copy]', scaleSwitcher);
    var list = $('[data-scale-list]', scaleSwitcher);

    $$('[data-scale]', scaleSwitcher).forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.getAttribute('data-scale');
        var data = scaleData[key];
        if (!data) return;

        $$('[data-scale]', scaleSwitcher).forEach(function (tab) {
          var active = tab === button;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', String(active));
        });

        label.textContent = data.label;
        title.textContent = data.title;
        copy.textContent = data.copy;
        list.innerHTML = data.list.map(function (item) { return '<li>' + item + '</li>'; }).join('');
      });
    });
  }

  /* Contact query preselection */
  var form = $('#project-form');
  if (form) {
    try {
      var params = new URLSearchParams(window.location.search);
      var project = (params.get('project') || '').toLowerCase();
      var map = {
        blueprint: 'Business Modernization Blueprint Review',
        review: 'Business Modernization Blueprint Review',
        audit: 'B2B Digital Commerce Audit',
        concept: 'Homepage Concept Sprint',
        redesign: 'Growth Website Redesign',
        retainer: 'Digital Growth Support',
        support: 'Digital Growth Support'
      };
      if (map[project]) {
        var projectSelect = $('#project-type', form);
        if (projectSelect) projectSelect.value = map[project];
      }
    } catch (error) {}

    /* Counters */
    $$('textarea[maxlength]', form).forEach(function (area) {
      var counter = $('[data-counter-for="' + area.id + '"]', form);
      if (!counter) return;
      var update = function () {
        counter.textContent = area.value.length + ' / ' + area.maxLength;
      };
      area.addEventListener('input', update);
      update();
    });

    /* Accessible validation */
    var status = $('[data-form-status]', form);

    function clearError(field) {
      field.removeAttribute('aria-invalid');
      var parent = field.closest('.field');
      var message = parent ? $('.field-error', parent) : null;
      if (message) message.remove();
    }

    function showError(field) {
      if (!field || field.type === 'hidden' || field.type === 'checkbox') return;
      field.setAttribute('aria-invalid', 'true');
      var parent = field.closest('.field');
      if (!parent || $('.field-error', parent)) return;
      var message = document.createElement('span');
      message.className = 'field-error';
      message.textContent = field.validity.typeMismatch ? 'Enter a valid value.' : 'This field is required.';
      parent.appendChild(message);
    }

    $$('input, select, textarea', form).forEach(function (field) {
      field.addEventListener('input', function () { clearError(field); });
      field.addEventListener('change', function () { clearError(field); });
    });

    form.addEventListener('submit', function (event) {
      $$('[aria-invalid="true"]', form).forEach(clearError);
      if (!form.checkValidity()) {
        event.preventDefault();
        var invalid = $$('input, select, textarea', form).filter(function (field) {
          return !field.validity.valid && field.type !== 'hidden';
        });
        invalid.forEach(showError);
        if (status) {
          status.className = 'form-status error';
          status.textContent = 'Please complete the required fields before submitting.';
        }
        if (invalid[0]) invalid[0].focus();
      }
    });
  }
})();
