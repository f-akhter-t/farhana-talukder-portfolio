/*
 * Portfolio interactions: theme toggle, mobile nav, scroll spy, scroll reveal,
 * background lattice, hero node ring, cursor, timeline, achievements dialog,
 * project filters, contact form and CV printing.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(pointer: fine)').matches;
  var THEME_KEY = 'fat-theme';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function rgba(hex, a) {
    var h = (hex || '#000000').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* Theme */
  function isDark() { return root.classList.contains('dark'); }
  function syncThemeButtons() {
    $$('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-checked', isDark() ? 'true' : 'false'); });
  }
  function setTheme(theme) {
    root.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    syncThemeButtons();
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  syncThemeButtons();
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(isDark() ? 'light' : 'dark'); });
  });

  /* Mobile navigation */
  (function () {
    var btn = $('[data-menu-toggle]'), menu = $('#mobile-menu');
    if (!btn || !menu) return;
    function set(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var icon = $('i', btn);
      if (icon) icon.className = 'ph-duotone ' + (open ? 'ph-x' : 'ph-list');
    }
    btn.addEventListener('click', function () { set(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && !menu.hidden) set(false); });
  })();

  /* Scroll spy for the homepage nav */
  (function () {
    var links = $$('[data-nav]');
    if (!links.length || !document.getElementById('about')) return;
    var ids = [];
    links.forEach(function (a) { if (ids.indexOf(a.dataset.nav) < 0) ids.push(a.dataset.nav); });
    function spy() {
      var cur = '';
      ids.forEach(function (id) { var el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 160) cur = id; });
      links.forEach(function (a) { if (a.dataset.nav === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  })();

  /* Scroll reveal */
  (function () {
    var els = $$('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* Printing the CV */
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
  if (/[?&]print=1/.test(location.search)) {
    window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 500); });
  }

  /* Background lattice */
  (function () {
    var c = document.getElementById('bg-lattice');
    if (!c || !window.LatticeBG) return;
    var bg = window.LatticeBG.start(c, { intensity: 0.75, fixed: true, dark: isDark() });
    document.addEventListener('themechange', function () { bg.set({ dark: isDark() }); });
    document.addEventListener('dialogtoggle', function (e) { if (e.detail && e.detail.open) bg.pause(); else bg.resume(); });
  })();

  /* Hero: node ring around the rectangular photo */
  (function () {
    var c = $('[data-hero-ring]');
    if (!c) return;
    var ctx = c.getContext('2d');
    var W = 0, H = 0, C = null;
    function readColors() { C = { gold: cssVar('--gold'), pink: cssVar('--pink'), green: cssVar('--green'), text: cssVar('--text') }; }
    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1), r = c.getBoundingClientRect();
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    readColors(); size();
    document.addEventListener('themechange', function () { readColors(); if (reduced) requestAnimationFrame(frame); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { size(); if (reduced) requestAnimationFrame(frame); }).observe(c);

    var PX = 0.28, PY = 0.30, GAPS = [0.075, 0.145, 0.215];
    function se(ang, a, b, n) { var co = Math.cos(ang), si = Math.sin(ang); return [a * Math.sign(co) * Math.pow(Math.abs(co), 2 / n), b * Math.sign(si) * Math.pow(Math.abs(si), 2 / n)]; }
    var tones = ['gold', 'text', 'green', 'text', 'pink', 'text'], nodes = [];
    GAPS.forEach(function (g, ri) {
      var count = [12, 15, 18][ri];
      for (var i = 0; i < count; i++) {
        nodes.push({ ri: ri, g: g + (Math.random() - 0.5) * 0.02, ang: (i / count) * 6.283 + ri * 0.3 + (Math.random() - 0.5) * 0.2,
          sx: Math.random(), sy: Math.random(), delay: Math.random() * 600, r: 1.8 + Math.random() * 2.4, tone: tones[(i + ri) % tones.length], ph: Math.random() * 6.283 });
      }
    });
    var edges = [];
    for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
      var a = nodes[i], b = nodes[j];
      if (Math.abs(a.ri - b.ri) > 1) continue;
      var da = Math.abs(a.ang - b.ang) % 6.283; if (da > 3.1416) da = 6.283 - da;
      if (da < (a.ri === b.ri ? 0.62 : 0.34)) edges.push([i, j]);
    }
    var spokes = nodes.map(function (n, i) { return i; }).filter(function (i) { return nodes[i].ri === 0 && i % 2 === 0; });
    var t0 = performance.now(), pulses = [], visible = true, running = false, last = 0;
    function ease(x) { x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); }
    function kick() { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }).observe(c);
    document.addEventListener('visibilitychange', kick);
    function frame(now) {
      running = false;
      if (!reduced && (!visible || document.hidden)) return;
      if (!reduced && now - last < 30) { running = true; requestAnimationFrame(frame); return; }
      last = now;
      if (!W) { size(); }
      var t = reduced ? 99999 : now - t0, cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      var pos = nodes.map(function (n) {
        var e = ease((t - n.delay) / 1500), rot = n.ang + (reduced ? 0 : t * 0.00005 * (n.ri % 2 ? 1 : -1));
        var d = se(rot, PX * W + n.g * W, PY * H + n.g * W, 5), tx = cx + d[0], ty = cy + d[1];
        return { x: n.sx * W + (tx - n.sx * W) * e, y: n.sy * H + (ty - n.sy * H) * e, e: e, n: n, rot: rot };
      });
      var edgeA = ease((t - 1100) / 900);
      ctx.lineWidth = 1;
      edges.forEach(function (ed, k) {
        var A = pos[ed[0]], B = pos[ed[1]], pulse = 0.55 + 0.45 * Math.sin(t * 0.0015 + k);
        ctx.strokeStyle = rgba(k % 7 === 0 ? C.gold : C.text, 0.26 * pulse * edgeA);
        var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, bend = 0.1 * Math.sin(t * 0.0007 + k);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx + (cx - mx) * bend, my + (cy - my) * bend, B.x, B.y); ctx.stroke();
        if (!reduced && edgeA >= 1 && pulses.length < 6 && Math.random() < 0.003) pulses.push({ i: ed[0], j: ed[1], s: 0, tone: ['gold', 'pink', 'green'][k % 3] });
      });
      spokes.forEach(function (i) {
        var A = pos[i], d = se(A.rot, PX * W + 5, PY * H + 5, 12);
        ctx.strokeStyle = rgba(C.gold, 0.4 * edgeA);
        ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(cx + d[0], cy + d[1]); ctx.stroke(); ctx.setLineDash([]);
      });
      pulses = pulses.filter(function (p) { return p.s <= 1; });
      pulses.forEach(function (p) {
        var A = pos[p.i], B = pos[p.j];
        ctx.fillStyle = rgba(C[p.tone], 0.95);
        ctx.beginPath(); ctx.arc(A.x + (B.x - A.x) * p.s, A.y + (B.y - A.y) * p.s, 2.6, 0, 6.283); ctx.fill();
        p.s += 0.012;
      });
      pos.forEach(function (p) {
        var glow = 0.65 + 0.35 * Math.sin(t * 0.002 + p.n.ph), col = C[p.n.tone];
        ctx.fillStyle = rgba(col, (p.n.tone === 'text' ? 0.45 : 0.9) * glow * Math.max(0.2, p.e));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.n.r, 0, 6.283); ctx.fill();
        if (p.n.tone !== 'text') { ctx.strokeStyle = rgba(col, 0.25 * glow * p.e); ctx.beginPath(); ctx.arc(p.x, p.y, p.n.r + 4, 0, 6.283); ctx.stroke(); }
      });
      if (!reduced) { running = true; requestAnimationFrame(frame); }
    }
    running = true;
    requestAnimationFrame(frame);
  })();

  /* Cursor: dot plus trailing ring. Off for touch and reduced motion. */
  (function () {
    if (!finePointer || reduced) return;
    var ring = document.createElement('div'), dot = document.createElement('div'), label = document.createElement('span');
    ring.className = 'cursor-ring'; dot.className = 'cursor-dot'; label.className = 'cursor-label';
    ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
    label.innerHTML = 'View <i class="ph-duotone ph-arrow-up-right" aria-hidden="true"></i>';
    ring.appendChild(label); document.body.appendChild(ring); document.body.appendChild(dot);
    root.classList.add('cursor-on');
    var mx = -200, my = -200, shown = false, down = false, mode = 'idle', target = null, targetRadius = 8;
    var cur = { x: -200, y: -200, w: 34, h: 34, r: 17 };
    document.addEventListener('mouseover', function (e) {
      var el = e.target; if (!el || !el.closest) return;
      if (el.closest('input, textarea, select')) { mode = 'text'; target = null; return; }
      if (el.closest('.stretched')) { mode = 'view'; target = null; return; }
      var snap = el.closest('a, button, [role="button"], [role="switch"]');
      if (snap && !snap.matches('[data-cursor="view"]')) {
        var r = snap.getBoundingClientRect();
        if (r.width <= 440 && r.height <= 120) {
          if (target !== snap) targetRadius = parseFloat(getComputedStyle(snap).borderTopLeftRadius) || 8;
          mode = 'snap'; target = snap; return;
        }
      }
      if (el.closest('[data-cursor="view"]')) { mode = 'view'; target = null; return; }
      if (snap || el.closest('[data-cursor], label, .zoom')) { mode = 'hover'; target = null; return; }
      mode = 'idle'; target = null;
    });
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; if (!shown) { shown = true; cur.x = mx; cur.y = my; } }, { passive: true });
    root.addEventListener('mouseleave', function () { shown = false; });
    window.addEventListener('mousedown', function () { down = true; });
    window.addEventListener('mouseup', function () { down = false; });
    var suspended = false;
    document.addEventListener('dialogtoggle', function (e) {
      suspended = !!(e.detail && e.detail.open);
      root.classList.toggle('cursor-on', !suspended);
      if (suspended) { ring.style.opacity = '0'; dot.style.opacity = '0'; }
    });
    function lerp(a, b, k) { return a + (b - a) * k; }
    function loop() {
      if (suspended) { requestAnimationFrame(loop); return; }
      var tx = mx, ty = my, tw = 34, th = 34, tr = 17, border = 'var(--line-strong)', bg = 'transparent', shadow = 'none', dotOp = 1, ringOp = shown ? 1 : 0, lab = 0;
      if (mode === 'snap' && target && target.isConnected) {
        var r = target.getBoundingClientRect(), br = targetRadius;
        var ccx = r.left + r.width / 2, ccy = r.top + r.height / 2;
        tw = r.width + 14; th = r.height + 14; tr = Math.min(th / 2, br + 7);
        tx = ccx + (mx - ccx) * 0.12; ty = ccy + (my - ccy) * 0.12;
        border = 'var(--gold)'; bg = 'color-mix(in srgb, var(--gold) 10%, transparent)';
        shadow = '0 0 0 4px color-mix(in srgb, var(--gold) 8%, transparent), 0 0 26px color-mix(in srgb, var(--gold) 32%, transparent)';
      } else if (mode === 'view') {
        tw = th = 80; tr = 40; border = 'var(--green)'; bg = 'var(--green)'; dotOp = 0; lab = 1;
        shadow = '0 12px 30px -10px color-mix(in srgb, var(--green) 70%, transparent)';
      } else if (mode === 'hover') {
        tw = th = 52; tr = 26; border = 'var(--gold)'; bg = 'color-mix(in srgb, var(--gold) 10%, transparent)';
      } else if (mode === 'text') { ringOp = 0; dotOp = 0; }
      var k = mode === 'snap' ? 0.3 : 0.2;
      cur.x = lerp(cur.x, tx, k); cur.y = lerp(cur.y, ty, k);
      cur.w = lerp(cur.w, tw, 0.24); cur.h = lerp(cur.h, th, 0.24); cur.r = lerp(cur.r, tr, 0.24);
      ring.style.width = cur.w + 'px'; ring.style.height = cur.h + 'px'; ring.style.borderRadius = cur.r + 'px';
      ring.style.transform = 'translate(' + (cur.x - cur.w / 2) + 'px,' + (cur.y - cur.h / 2) + 'px) scale(' + (down ? 0.92 : 1) + ')';
      ring.style.borderColor = border; ring.style.backgroundColor = bg; ring.style.boxShadow = shadow; ring.style.opacity = ringOp;
      label.style.opacity = lab;
      dot.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
      dot.style.opacity = shown ? dotOp : 0;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  /* Timeline: fill the spine and light entries as you scroll */
  (function () {
    var wrap = $('.tl-wrap');
    if (!wrap) return;
    var fill = $('.tl-fill', wrap), items = $$('.tl-item', wrap);
    function update() {
      if (reduced) { if (fill) fill.style.height = '100%'; items.forEach(function (li) { li.classList.add('is-lit'); }); return; }
      var r = wrap.getBoundingClientRect(), line = window.innerHeight * 0.62;
      var p = Math.min(1, Math.max(0, (line - r.top) / r.height));
      if (fill) fill.style.height = (p * 100).toFixed(2) + '%';
      items.forEach(function (li) { var b = li.getBoundingClientRect(); li.classList.toggle('is-lit', b.top + b.height / 2 < line); });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* Achievements: detail dialog with prev / next */
  (function () {
    var dialog = document.getElementById('ach-dialog'), dataEl = document.getElementById('ach-data');
    if (!dialog || !dataEl) return;
    var items = JSON.parse(dataEl.textContent), idx = 0, opener = null;
    var el = {
      media: $('[data-d-media]', dialog), bg: $('[data-d-bg]', dialog), img: $('[data-d-img]', dialog),
      group: $('[data-d-group]', dialog), groupIcon: $('[data-d-group-icon]', dialog), groupText: $('[data-d-group-text]', dialog),
      title: $('[data-d-title]', dialog), issuer: $('[data-d-issuer]', dialog), desc: $('[data-d-desc]', dialog),
      rows: $('[data-d-rows]', dialog), project: $('[data-d-project]', dialog), pos: $('[data-d-pos]', dialog)
    };
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function render() {
      var it = items[idx];
      el.bg.src = it.img; el.img.src = it.img; el.img.alt = 'Certificate: ' + it.t;
      el.group.className = 'tag tone-' + it.tone;
      el.groupIcon.className = 'ph-duotone ' + it.icon;
      el.groupText.textContent = it.group;
      el.title.textContent = it.t; el.issuer.textContent = it.issuer; el.desc.textContent = it.desc;
      el.rows.innerHTML = it.rows.map(function (r) { return '<div class="kv"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
      if (it.project) { el.project.hidden = false; el.project.style.display = ''; el.project.href = it.project; }
      else { el.project.hidden = true; el.project.style.display = 'none'; el.project.removeAttribute('href'); }
      el.pos.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
    }
    function open(i, from) {
      idx = i; opener = from || null; render();
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      document.dispatchEvent(new CustomEvent('dialogtoggle', { detail: { open: true, dialog: dialog } }));
    }
    function close() { if (dialog.open) dialog.close(); }
    function step(d) { idx = (idx + d + items.length) % items.length; render(); }
    dialog.addEventListener('close', function () {
      document.dispatchEvent(new CustomEvent('dialogtoggle', { detail: { open: false } }));
      if (opener) opener.focus();
    });
    $$('[data-ach]').forEach(function (b) { b.addEventListener('click', function () { open(+b.dataset.ach, b); }); });
    dialog.addEventListener('click', function (e) {
      var t = e.target;
      if (t === dialog) { close(); return; }
      if (t.closest('[data-d-close]')) { e.preventDefault(); close(); }
      else if (t.closest('[data-d-prev]')) { e.preventDefault(); step(-1); }
      else if (t.closest('[data-d-next]')) { e.preventDefault(); step(1); }
    });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
  })();

  /* Magnifier: hover a certificate to zoom into the spot under the pointer */
  (function () {
    $$('[data-magnify]').forEach(function (box) {
      var SCALE = +box.dataset.magnify || 2.2;
      function img() { return $('.zoom-contain', box); }
      box.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var i = img(); if (!i || !i.getAttribute('src')) return;
        var r = box.getBoundingClientRect();
        var x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
        var y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
        i.style.transformOrigin = x + '% ' + y + '%';
        i.style.transform = 'scale(' + SCALE + ')';
        box.classList.add('is-magnified');
      });
      box.addEventListener('pointerleave', function () {
        var i = img(); if (i) i.style.transform = '';
        box.classList.remove('is-magnified');
      });
    });
    document.addEventListener('dialogtoggle', function () {
      $$('[data-magnify]').forEach(function (box) { var i = $('.zoom-contain', box); if (i) i.style.transform = ''; box.classList.remove('is-magnified'); });
    });
  })();

  /* All-projects filter */
  (function () {
    var btns = $$('[data-filter]');
    if (!btns.length) return;
    var groups = $$('[data-group]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.dataset.filter;
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        groups.forEach(function (g) { g.hidden = !(key === 'all' || g.dataset.group === key); });
      });
    });
  })();

  /* Contact form.
   * Primary: Web3Forms (set web3formsKey in js/config.js). Works from any host.
   * Fallback: FormSubmit, which only works on a real web address (http/https). */
  (function () {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var cfg = window.SITE_CONFIG || {};
    var TO = cfg.email || 'f.akhter.t13@gmail.com';
    var btn = $('button[type="submit"]', form), label = $('[data-label]', btn), icon = $('[data-icon]', btn), status = $('[data-status]', form);
    var fields = { name: form.elements.name, email: form.elements.email, message: form.elements.message };
    function setErr(k, msg) {
      var err = document.getElementById('err-' + k);
      fields[k].setAttribute('aria-invalid', msg ? 'true' : 'false');
      err.textContent = msg || ''; err.hidden = !msg;
    }
    Object.keys(fields).forEach(function (k) { fields[k].addEventListener('input', function () { setErr(k, ''); }); });

    function parse(res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (!res.ok || j.success === false || String(j.success) === 'false') {
          var e = new Error(j.message || ('The mail service answered with status ' + res.status));
          e.service = true; throw e;
        }
        return j;
      });
    }
    function send(v) {
      var subject = 'Portfolio message from ' + v.name;
      if (cfg.web3formsKey) {
        return fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: cfg.web3formsKey, subject: subject, from_name: 'Portfolio contact form',
            name: v.name, email: v.email, replyto: v.email, message: v.message })
        }).then(parse);
      }
      if (location.protocol === 'file:') {
        var e = new Error('This page is open as a local file. The form can only send from a web address (see README, step 3), or once a Web3Forms key is added in js/config.js.');
        e.service = true; return Promise.reject(e);
      }
      return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(TO), {
        method: 'POST',
        referrerPolicy: 'unsafe-url',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: v.name, email: v.email, message: v.message, _replyto: v.email, _subject: subject, _template: 'table', _captcha: 'false' })
      }).then(parse);
    }
    function mailto(v) {
      return 'mailto:' + TO + '?subject=' + encodeURIComponent('Portfolio message from ' + v.name) + '&body=' + encodeURIComponent(v.message + '\n\n' + v.name + ' (' + v.email + ')');
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = { name: fields.name.value.trim(), email: fields.email.value.trim(), message: fields.message.value.trim() };
      var first = null;
      if (!v.name) { setErr('name', 'Please add your name.'); first = first || fields.name; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { setErr('email', 'Please use a valid email address.'); first = first || fields.email; }
      if (v.message.length < 10) { setErr('message', 'A sentence or two, please.'); first = first || fields.message; }
      if (first) { first.focus(); return; }
      btn.disabled = true; label.textContent = 'Sending...'; icon.className = 'ph-duotone ph-circle-notch spin';
      status.className = 'form-status'; status.textContent = '';
      send(v).then(function () {
        form.reset();
        status.className = 'form-status is-ok';
        status.innerHTML = '<i class="ph-duotone ph-check-circle" aria-hidden="true"></i><span>Thanks, your message is on its way. I\'ll get back to you soon.</span>';
      }).catch(function (err) {
        var reason = err && err.service ? err.message : 'The network request was blocked or failed.';
        if (window.console) console.warn('[contact]', err);
        status.className = 'form-status is-error';
        status.innerHTML = '<span>Couldn\'t send just now. ' + esc(reason) + ' You can also <a href="' + mailto(v) + '">email me directly</a>.</span>';
      }).then(function () {
        btn.disabled = false; label.textContent = 'Send message'; icon.className = 'ph-duotone ph-paper-plane-tilt';
      });
    });
  })();
})();
