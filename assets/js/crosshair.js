/* Crosshair cursor: live coordinates, locks onto links and buttons and measures them.
   Vanilla JS port of "Crosshair" from React Bits (David Haz, reactbits.dev, github.com/DavidHDev/react-bits).
   No dependencies. Drop in with: <script src="assets/js/crosshair.js"></script>
   Override any option before the script loads, e.g.
   <script>window.CROSSHAIR_OPTIONS = { color: "#ffffff", hideCursor: true };</script> */
(function () {
  "use strict";
  if (window.__crosshair) return;
  // Mouse-like devices only. Touch screens keep their normal behaviour.
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var DEFAULTS = {
    color: "#E84B3A",          // coral accent: readable on both the blue landing and the cream pages
    thickness: 1,
    opacity: 0.85,
    lineStyle: "solid",        // solid | dashed | dotted
    gap: 10,                   // empty space around the pointer, in px
    fade: 0,                   // 0 to 1, fades the lines towards the screen edges
    smoothing: 0.35,           // 0 = instant, 1 = very floaty
    showCoordinates: true,
    targetEffect: "lock",      // lock | glitch | none
    targetSelector: "a, button, [data-crosshair-target]",
    clickPulse: true,
    hideCursor: false,         // true hides the system pointer
    blendMode: "normal"        // e.g. "difference" for a colour that always contrasts
  };
  var o = Object.assign({}, DEFAULTS, window.CROSSHAIR_OPTIONS || {});
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var S = {
    color: o.color, thickness: clamp(o.thickness, 0.5, 8), opacity: clamp(o.opacity, 0, 1),
    lineStyle: ["solid", "dashed", "dotted"].indexOf(o.lineStyle) > -1 ? o.lineStyle : "solid",
    gap: Math.max(0, o.gap), fade: clamp(o.fade, 0, 1), smoothing: clamp(o.smoothing, 0, 1),
    showCoordinates: !!o.showCoordinates,
    targetEffect: ["lock", "glitch", "none"].indexOf(o.targetEffect) > -1 ? o.targetEffect : "lock",
    targetSelector: o.targetSelector, clickPulse: !!o.clickPulse, hideCursor: !!o.hideCursor
  };

  var FONT = "500 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var HIDDEN = "crosshair-cursor-hidden";

  var style = document.createElement("style");
  style.textContent = "." + HIDDEN + ", ." + HIDDEN + " * { cursor: none !important; }";
  document.head.appendChild(style);

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:10000;mix-blend-mode:" + o.blendMode;
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var st = {
    x: 0, y: 0, tx: 0, ty: 0, clientX: 0, clientY: 0, inside: false, seen: false,
    presence: 0, glitch: 0, target: null, lock: { x: 0, y: 0, w: 0, h: 0, alpha: 0 }, pulses: []
  };
  var size = { w: 0, h: 0, dpr: 1 };
  var raf = 0, last = 0, alive = true, resizePending = false;

  function toRgb(color) {
    ctx.fillStyle = "#000"; ctx.fillStyle = color;
    var v = String(ctx.fillStyle);
    if (v.charAt(0) === "#") {
      var hex = parseInt(v.slice(1, 7), 16);
      return { r: (hex >> 16) & 255, g: (hex >> 8) & 255, b: hex & 255, a: 1 };
    }
    var p = (v.match(/[\d.]+/g) || [255, 255, 255, 1]).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] == null ? 1 : p[3] };
  }
  var ink = toRgb(S.color);

  function applyResize() {
    var rect = canvas.getBoundingClientRect();
    size.dpr = Math.min(window.devicePixelRatio || 1, 2);
    size.w = rect.width; size.h = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * size.dpr));
    canvas.height = Math.max(1, Math.round(rect.height * size.dpr));
  }
  function rgba(alpha) { return "rgba(" + ink.r + ", " + ink.g + ", " + ink.b + ", " + clamp(alpha * ink.a, 0, 1) + ")"; }
  function crisp(value, width) {
    var device = Math.round(width * size.dpr);
    return (Math.round(value * size.dpr) + (device % 2 ? 0.5 : 0)) / size.dpr;
  }

  function tag(text, x, y, align) {
    ctx.font = FONT;
    var width = ctx.measureText(text).width + 10, height = 16;
    var left = align === "center" ? x - width / 2 : x;
    var top = align === "middle" ? y - height / 2 : y;
    left = clamp(left, 4, size.w - width - 4);
    top = clamp(top, 4, size.h - height - 4);
    var light = ink.r * 0.2126 + ink.g * 0.7152 + ink.b * 0.0722 > 150;
    ctx.fillStyle = rgba(1);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(left, top, width, height, 3); else ctx.rect(left, top, width, height);
    ctx.fill();
    ctx.fillStyle = light ? "#0a0a0a" : "#ffffff";
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.fillText(text, left + width / 2, top + height / 2 + 0.5);
  }

  function segment(x1, y1, x2, y2, horizontal) {
    var length = horizontal ? x2 - x1 : y2 - y1;
    if (length <= 0) return;
    if (S.fade > 0) {
      var g = horizontal ? ctx.createLinearGradient(0, 0, size.w, 0) : ctx.createLinearGradient(0, 0, 0, size.h);
      var at = clamp(horizontal ? st.x / size.w : st.y / size.h, 0.001, 0.999);
      g.addColorStop(0, rgba(1 - S.fade)); g.addColorStop(at, rgba(1)); g.addColorStop(1, rgba(1 - S.fade));
      ctx.strokeStyle = g;
    } else ctx.strokeStyle = rgba(1);
    ctx.beginPath();
    if (st.glitch > 0.01) {
      var pieces = Math.max(4, Math.round(length / 28));
      for (var i = 0; i < pieces; i++) {
        var j = (Math.random() - 0.5) * 14 * st.glitch, from = i / pieces, to = (i + 1) / pieces;
        if (horizontal) { ctx.moveTo(x1 + length * from, y1 + j); ctx.lineTo(x1 + length * to, y1 + j); }
        else { ctx.moveTo(x1 + j, y1 + length * from); ctx.lineTo(x1 + j, y1 + length * to); }
      }
    } else { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
  }

  function brackets(x, y, w, h, alpha) {
    var arm = Math.min(14, w / 3, h / 3);
    ctx.strokeStyle = rgba(alpha); ctx.lineWidth = Math.max(1.5, S.thickness);
    ctx.setLineDash([]); ctx.lineCap = "square"; ctx.beginPath();
    ctx.moveTo(x, y + arm); ctx.lineTo(x, y); ctx.lineTo(x + arm, y);
    ctx.moveTo(x + w - arm, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + arm);
    ctx.moveTo(x + w, y + h - arm); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - arm, y + h);
    ctx.moveTo(x + arm, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - arm);
    ctx.stroke();
  }

  function draw() {
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (st.presence > 0.001) {
      ctx.globalAlpha = st.presence * S.opacity * (1 - 0.6 * st.lock.alpha);
      ctx.lineWidth = S.thickness;
      ctx.lineCap = S.lineStyle === "dotted" ? "round" : "butt";
      if (S.lineStyle === "dashed") ctx.setLineDash([S.thickness * 6, S.thickness * 5]);
      else if (S.lineStyle === "dotted") ctx.setLineDash([0, S.thickness * 4]);
      else ctx.setLineDash([]);
      var x = crisp(st.x, S.thickness), y = crisp(st.y, S.thickness);
      segment(0, y, x - S.gap, y, true); segment(x + S.gap, y, size.w, y, true);
      segment(x, 0, x, y - S.gap, false); segment(x, y + S.gap, x, size.h, false);
      if (S.hideCursor) {
        ctx.fillStyle = rgba(1); ctx.beginPath();
        ctx.arc(st.x, st.y, Math.max(1.5, S.thickness * 1.5), 0, Math.PI * 2); ctx.fill();
      }
      if (S.showCoordinates && st.lock.alpha < 0.999) {
        ctx.globalAlpha = st.presence * S.opacity * (1 - st.lock.alpha);
        tag(String(Math.round(st.x)), st.x, 8, "center");
        tag(String(Math.round(st.y)), 8, st.y, "middle");
      }
    }
    if (st.lock.alpha > 0.001) {
      var L = st.lock;
      ctx.globalAlpha = L.alpha * S.opacity;
      brackets(L.x, L.y, L.w, L.h, 1);
      if (S.showCoordinates && st.target) {
        var box = st.target.getBoundingClientRect();
        tag(Math.round(box.width) + " \u00d7 " + Math.round(box.height), L.x + L.w / 2, L.y + L.h + 8, "center");
      }
    }
    st.pulses.forEach(function (p) {
      var t = p.age / 0.55, eased = 1 - Math.pow(1 - t, 3);
      ctx.globalAlpha = Math.pow(1 - t, 2) * S.opacity;
      ctx.strokeStyle = rgba(1); ctx.lineWidth = Math.max(1, S.thickness); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 + 30 * eased, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function relative() {
    var rect = canvas.getBoundingClientRect();
    st.tx = st.clientX - rect.left; st.ty = st.clientY - rect.top;
    return rect;
  }

  function tick(now) {
    raf = 0;
    if (resizePending) { resizePending = false; applyResize(); }
    if (!alive) return;
    var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    var rect = relative();
    var follow = reduce || S.smoothing === 0 ? 1 : 1 - Math.exp(-dt / (0.008 + S.smoothing * 0.16));
    st.x += (st.tx - st.x) * follow; st.y += (st.ty - st.y) * follow;
    var wanted = st.inside ? 1 : 0;
    st.presence += (wanted - st.presence) * (reduce ? 1 : 1 - Math.exp(-dt / (wanted ? 0.12 : 0.25)));
    if (Math.abs(wanted - st.presence) < 0.002) st.presence = wanted;
    var lock = st.lock, locked = S.targetEffect === "lock" && st.inside ? st.target : null, goal;
    if (locked && !document.contains(locked)) { st.target = null; locked = null; }
    if (locked) {
      var b = locked.getBoundingClientRect();
      goal = { x: b.left - rect.left - 6, y: b.top - rect.top - 6, w: b.width + 12, h: b.height + 12 };
    } else goal = { x: st.x - 10, y: st.y - 10, w: 20, h: 20 };
    var snap = reduce ? 1 : 1 - Math.exp(-dt / 0.085);
    lock.x += (goal.x - lock.x) * snap; lock.y += (goal.y - lock.y) * snap;
    lock.w += (goal.w - lock.w) * snap; lock.h += (goal.h - lock.h) * snap;
    var shown = locked ? 1 : 0;
    lock.alpha += (shown - lock.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / (shown ? 0.08 : 0.14)));
    if (Math.abs(shown - lock.alpha) < 0.002) lock.alpha = shown;
    st.glitch = reduce ? 0 : Math.max(0, st.glitch - dt / 0.5);
    st.pulses = st.pulses.filter(function (p) { return (p.age += dt) < 0.55; });
    draw();
    var settling = Math.abs(st.tx - st.x) > 0.05 || Math.abs(st.ty - st.y) > 0.05 || st.presence !== wanted ||
      lock.alpha !== shown || (locked && Math.abs(goal.w - lock.w) + Math.abs(goal.x - lock.x) + Math.abs(goal.y - lock.y) > 0.1) ||
      st.glitch > 0 || st.pulses.length > 0;
    // Keep running while a target is locked: the page may scroll underneath it.
    if (settling || locked) raf = requestAnimationFrame(tick);
  }
  function wake() { if (raf || !alive) return; last = performance.now(); raf = requestAnimationFrame(tick); }
  function setHidden(h) { document.documentElement.classList.toggle(HIDDEN, h); }

  function pick(el) {
    if (S.targetEffect === "none" || !(el instanceof Element)) return null;
    try { return el.closest(S.targetSelector); } catch (e) { return null; }
  }
  function retarget(el) {
    var next = pick(el);
    if (next === st.target) return;
    st.target = next;
    if (next && S.targetEffect === "glitch") st.glitch = 1;
  }
  function enter() {
    if (!st.seen) {
      st.seen = true; relative();
      st.x = st.tx; st.y = st.ty;
      st.lock.x = st.x - 10; st.lock.y = st.y - 10; st.lock.w = 20; st.lock.h = 20;
    }
    st.inside = true; setHidden(S.hideCursor);
  }
  function leave() { st.inside = false; st.target = null; setHidden(false); wake(); }

  function onMove(e) {
    st.clientX = e.clientX; st.clientY = e.clientY;
    if (e.pointerType === "touch" && e.buttons === 0) return;
    enter(); retarget(e.target); wake();
  }
  function onDown(e) {
    onMove(e);
    if (!S.clickPulse || reduce) return;
    relative(); st.pulses.push({ x: st.tx, y: st.ty, age: 0 }); wake();
  }
  function onUp(e) { if (e.pointerType !== "mouse") leave(); }
  function onOut(e) { if (!e.relatedTarget) leave(); }
  function onScroll() {
    if (!st.inside) return;
    retarget(document.elementFromPoint(st.clientX, st.clientY)); wake();
  }
  function onResize() { resizePending = true; wake(); }

  var ro = "ResizeObserver" in window ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(canvas); else window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("scroll", onScroll, { capture: true, passive: true });
  document.addEventListener("pointerout", onOut);
  resizePending = true; wake();

  window.__crosshair = {
    destroy: function () {
      alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect();
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll, { capture: true }); document.removeEventListener("pointerout", onOut);
      setHidden(false); canvas.remove(); style.remove(); delete window.__crosshair;
    }
  };
})();
