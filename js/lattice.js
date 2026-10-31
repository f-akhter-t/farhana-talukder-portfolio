/*
 * Background lattice: two families of wavy lines that cross into a mesh and
 * glow where soft pastel "clouds" drift through. Built for low CPU use:
 * capped frame rate, batched strokes, paused when the tab is hidden, when a
 * dialog is open, or when the user prefers reduced motion (one still frame).
 *
 * window.LatticeBG.start(canvas, { intensity, dark, fixed }) -> { set, refresh, pause, resume, stop }
 */
(function () {
  'use strict';
  var perm = new Uint8Array(512);
  (function () {
    var s = 1337, p = [], i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; var j = s % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
  function hash(i, j) { return perm[(perm[i & 255] + j) & 255] / 255; }
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { return noise(x, y) * 0.62 + noise(x * 2.03 + 17.1, y * 2.03 + 9.2) * 0.38; }
  function sstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function rgb(str, fb) {
    var s = String(str || fb).trim().replace('#', '');
    if (s.length === 3) s = s.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(s, 16);
    if (isNaN(n)) return rgb(fb, fb);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  function start(canvas, o) {
    var opts = { intensity: 0.75, dark: false, fixed: true };
    for (var k in o) opts[k] = o[k];
    var ctx = canvas.getContext('2d');
    var fogC = document.createElement('canvas'), fctx = fogC.getContext('2d');
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FOG = 16, FPS = 30, S = 42, STEP = 24, SLOPE = 0.62, HUES = 6, MIXES = 4, ALPHAS = 8;
    var W = 0, H = 0, fogImg = null, raf = 0, last = 0, frameNo = 0, stopped = false, paused = false, palette = null;
    var mouse = { x: -9999, y: -9999, on: false, k: 0 };
    var t0 = performance.now();

    function readColors() {
      var cs = getComputedStyle(canvas), g = function (n) { return cs.getPropertyValue(n); };
      var C = { text: rgb(g('--text'), '#2A2420'), gold: rgb(g('--gold'), '#C9974B'), pink: rgb(g('--pink'), '#E8A6B8'), green: rgb(g('--green'), '#4F7A5B') };
      function tri(t) { t = Math.min(1, Math.max(0, (t - 0.2) / 0.6)); return t < 0.5 ? mix(C.pink, C.gold, t * 2) : mix(C.gold, C.green, (t - 0.5) * 2); }
      var hues = [], strokes = [], h, m;
      for (h = 0; h < HUES; h++) hues.push(tri((h + 0.5) / HUES));
      for (m = 0; m < MIXES; m++) {
        strokes[m] = [];
        for (h = 0; h < HUES; h++) {
          var c = m === 0 ? C.text : mix(C.text, hues[h], m / (MIXES - 1));
          strokes[m][h] = 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
        }
      }
      palette = { tri: tri, strokes: strokes };
    }
    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(1.5, window.devicePixelRatio || 1);
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w === W && h === H && canvas.width === Math.round(w * dpr)) return;
      W = w; H = h;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fogC.width = Math.ceil(W / FOG) + 1; fogC.height = Math.ceil(H / FOG) + 1;
      fogImg = fctx.createImageData(fogC.width, fogC.height);
      frameNo = 0;
    }
    function density(x, y, tt) { return fbm(x * 0.0032 + tt * 1.6, y * 0.0038 - tt); }
    function hueAt(x, y, tt) { return noise(x * 0.0019 + 40 + tt * 0.8, y * 0.0019 + 11); }

    function drawFog(tt, oy, strength) {
      if (frameNo % 3 === 0) {
        var fw = fogC.width, fh = fogC.height, d = fogImg.data;
        for (var y = 0; y < fh; y++) for (var x = 0; x < fw; x++) {
          var wx = x * FOG, wy = y * FOG + oy, den = sstep(0.4, 0.7, density(wx, wy, tt)), col = palette.tri(hueAt(wx, wy, tt)), i = (y * fw + x) * 4;
          d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = den * strength * 255;
        }
        fctx.putImageData(fogImg, 0, 0);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(fogC, 0, 0, fogC.width * FOG, fogC.height * FOG);
    }
    function frame(now) {
      raf = 0;
      if (stopped) return;
      if (!canvas.isConnected) { stop(); return; }
      if (!reduced && !paused && now - last < 1000 / FPS - 2) { schedule(); return; }
      last = now;
      resize();
      if (!palette) readColors();
      var t = reduced ? 0 : now - t0, tt = t * 0.00003, oy = opts.fixed ? window.scrollY * 0.15 : 0, gain = opts.intensity;
      mouse.k += ((mouse.on && !reduced ? 1 : 0) - mouse.k) * 0.12;
      ctx.clearRect(0, 0, W, H);
      if (gain > 0.001) {
        drawFog(tt, oy, opts.dark ? 0.14 : 0.2);
        var base = (opts.dark ? 0.05 : 0.06) * gain, amp = 0.5 * gain, buckets = {};
        [1, -1].forEach(function (f) {
          var span = W * SLOPE, kmin = Math.floor((-span - S * 2 + oy) / S), kmax = Math.ceil((H + span + S * 2 + oy) / S);
          for (var kk = kmin; kk <= kmax; kk++) {
            var px = 0, py = 0, pd = 0, has = false;
            for (var x = -STEP; x <= W + STEP; x += STEP) {
              var wy0 = kk * S + f * (x - W / 2) * SLOPE;
              var y0 = wy0 - oy;
              if (y0 < -120 || y0 > H + 120) { has = false; continue; }
              var den0 = sstep(0.36, 0.66, density(x, wy0, tt));
              var wy = wy0 + Math.sin(x * 0.011 + t * 0.0005 * f + kk * 0.8) * (6 + den0 * 16);
              var yy = wy - oy, xx = x, lift = 0;
              if (mouse.k > 0.01) {
                var dx = xx - mouse.x, dy = yy - mouse.y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
                if (dd < 170) { lift = (1 - dd / 170) * mouse.k; xx += (dx / dd) * lift * 18; yy += (dy / dd) * lift * 18; }
              }
              var den = Math.min(1, den0 + lift * 0.9);
              if (has) {
                var dm = Math.min(den, pd);
                var a = base + dm * amp;
                var mi = dm > 0.02 ? Math.min(MIXES - 1, Math.max(1, Math.round(Math.min(1, dm * 1.4) * (MIXES - 1)))) : 0;
                var hi = mi ? Math.min(HUES - 1, Math.floor(hueAt(xx, wy, tt) * HUES)) : 0;
                var ai = Math.min(ALPHAS - 1, Math.round((a / (base + amp)) * (ALPHAS - 1)));
                var key = mi + '|' + hi + '|' + ai;
                var b = buckets[key] || (buckets[key] = { p: new Path2D(), mi: mi, hi: hi, a: (ai / (ALPHAS - 1)) * (base + amp) });
                b.p.moveTo(px, py); b.p.lineTo(xx, yy);
              }
              px = xx; py = yy; pd = den; has = true;
            }
          }
        });
        ctx.lineWidth = 1;
        for (var key2 in buckets) {
          var bk = buckets[key2];
          if (bk.a < 0.004) continue;
          ctx.globalAlpha = Math.min(1, bk.a);
          ctx.strokeStyle = palette.strokes[bk.mi][bk.hi];
          ctx.stroke(bk.p);
        }
        ctx.globalAlpha = 1;
      }
      frameNo++;
      if (!reduced) schedule();
    }
    function schedule() { if (!raf && !stopped && !paused && !document.hidden) raf = requestAnimationFrame(frame); }
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.on = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height;
    }
    function onVis() { if (!document.hidden) { last = 0; schedule(); } }
    function stop() { stopped = true; if (raf) cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); document.removeEventListener('visibilitychange', onVis); }
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    if (reduced) window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    raf = requestAnimationFrame(frame);
    return {
      set: function (n) { for (var k2 in n) opts[k2] = n[k2]; readColors(); frameNo = 0; if (reduced && !raf) raf = requestAnimationFrame(frame); },
      refresh: function () { readColors(); frameNo = 0; if (reduced && !raf) raf = requestAnimationFrame(frame); },
      pause: function () { paused = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      resume: function () { paused = false; last = 0; schedule(); },
      stop: stop
    };
  }
  window.LatticeBG = { start: start };
})();
