if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) { window.scrollTo(0, 0); window.addEventListener("load", function () { window.scrollTo(0, 0); if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); }); }

(function () {
  // The fixed nav is transparent over the dark hero and picks up a coconut bar once the
  // intro sheet has risen behind it. Driven off the hero's own box, not a fixed offset.
  var bar = document.querySelector(".topbar");
  var hero = document.querySelector(".hero");
  if (!bar || !hero) return;
  var barH = bar.offsetHeight;
  // one rect read per scroll event, applied straight away: cheap enough for a single element,
  // and it keeps the bar correct on the very first frame instead of a rAF later
  function apply() {
    // the landing is light and long, so the bar turns solid as soon as the page moves
    bar.classList.toggle("solid", hero.getBoundingClientRect().top < -8);
  }
  window.addEventListener("scroll", apply, { passive: true });
  window.addEventListener("resize", function () { barH = bar.offsetHeight; apply(); });
  apply();
})();



(function () {
  // HERO ROLE: Product Designer, Builder, Thinker, one after another, each resolving out of
  // scrambled glyphs left to right, the same decrypt as the intro. The whole line scrambles.
  var el = document.querySelector(".hero-role .hr-text");
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var WORDS = ["UI/UX Designer", "Product Designer", "UX Researcher"];
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>?";
  var LEAD = 260, STAGGER = 42, TICK = 55, HOLD = 2600;
  var cur = 0, cells = [], from = "", to = "", t0 = 0, raf = 0;
  function glyph(i, t) {
    var h = (i * 374761393 + Math.floor(t / TICK) * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return GLYPHS.charAt(Math.abs(h ^ (h >>> 16)) % GLYPHS.length);
  }
  function build(word) {
    el.textContent = ""; cells = [];
    for (var i = 0; i < word.length; i++) {
      var c = document.createElement("span");
      c.className = "dc"; c.textContent = word[i] === " " ? "\u00a0" : word[i];
      el.appendChild(c); cells.push(c);
    }
    // each box keeps its final letter's width, so the centred line holds still in the noise
    cells.forEach(function (c) { c.style.width = c.getBoundingClientRect().width + "px"; });
  }
  function frame(now) {
    var t = now - t0, done = true, k = 0;
    for (var i = 0; i < cells.length; i++) {
      if (to[i] === " ") continue;
      var lockAt = LEAD + k * STAGGER; k++;
      var c = cells[i], state = t < lockAt ? "scr" : "on";
      var ch = state === "scr" ? glyph(i, t) : to[i];
      if (state === "scr") done = false;
      if (c.textContent !== ch) c.textContent = ch;
      if (c.getAttribute("data-s") !== state) c.setAttribute("data-s", state);
    }
    if (!done) raf = requestAnimationFrame(frame);
    else { raf = 0; setTimeout(next, HOLD); }
  }
  function next() {
    if (document.hidden) { setTimeout(next, 800); return; }
    from = WORDS[cur]; cur = (cur + 1) % WORDS.length; to = WORDS[cur];
    build(to); t0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  // the first change comes once the name has risen and been read
  var offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--intro-offset")) || 0;
  setTimeout(next, offset + 3200);
})();

// DECKS: the peers testimonials and the landing's case files move the same way. Drag the top
// card past a threshold and it flies off and joins the back; the arrows and arrow keys do the
// same, and "previous" brings the back card forward.
function makeDeck(deck, cardSel, ctrl, onPaint) {
  if (!deck) return;
  var cards = [].slice.call(deck.querySelectorAll(cardSel));
  var count = ctrl && ctrl.querySelector(".pr-count b");
  var order = cards.slice(), busy = false;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function paint() {
    order.forEach(function (c, i) { c.setAttribute("data-pos", i); c.style.transform = ""; c.setAttribute("aria-hidden", i ? "true" : "false"); if (c.tagName === "A") c.tabIndex = i ? -1 : 0; });
    if (count) count.textContent = ("0" + (cards.indexOf(order[0]) + 1)).slice(-2);
    if (onPaint) onPaint(order);
  }
  function next(dir, dx) {
    if (busy) return; busy = true;
    var top = order[0];
    if (dir > 0) {
      if (reduce) { order.push(order.shift()); paint(); busy = false; return; }
      // out to the right (or the way it was dragged), clear of the deck, then it slides back in
      // behind the others as the next card settles on top
      var side = dx !== undefined && dx < 0 ? -1 : 1;
      var w = top.getBoundingClientRect().width;
      top.classList.add("flying");
      top.style.transform = "translate(" + side * (w * 0.78) + "px, -24px) rotate(" + side * 9 + "deg)";
      setTimeout(function () {
        top.classList.remove("flying");
        order.push(order.shift()); paint();
        setTimeout(function () { busy = false; }, 420);
      }, 380);
    } else {
      order.unshift(order.pop()); paint(); busy = false;
    }
  }
  if (ctrl) ctrl.querySelectorAll(".pr-btn").forEach(function (b) {
    b.addEventListener("click", function () { next(Number(b.dataset.go)); });
  });
  deck.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { next(1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { next(-1); e.preventDefault(); }
  });
  // a card that is itself a link can be dragged too; a drag never counts as a click on it
  var sx = 0, sy = 0, dx = 0, drag = null, moved = false;
  deck.addEventListener("pointerdown", function (e) {
    var c = e.target.closest(cardSel), a = e.target.closest("a");
    if (!c || c !== order[0] || busy || (a && a !== c) || e.button > 0) return;
    drag = c; sx = e.clientX; sy = e.clientY; dx = 0; moved = false;
    c.classList.add("dragging"); c.setPointerCapture(e.pointerId);
  });
  deck.addEventListener("pointermove", function (e) {
    if (!drag) return;
    dx = e.clientX - sx; var dy = (e.clientY - sy) * 0.35;
    if (Math.abs(dx) > 6) moved = true;
    drag.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx * 0.04 + "deg)";
  });
  function release() {
    if (!drag) return;
    var c = drag; drag = null; c.classList.remove("dragging");
    if (Math.abs(dx) > 110) next(1, dx); else c.style.transform = "";
  }
  deck.addEventListener("pointerup", release);
  deck.addEventListener("pointercancel", release);
  deck.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  deck.addEventListener("dragstart", function (e) { e.preventDefault(); });
  paint();
}

makeDeck(document.querySelector(".pr-deck"), ".pr-card", document.querySelector(".pr-side .pr-ctrl"));

(function () {
  // THE WORK DECK. Only the top card's cover plays, and only once the page has loaded and the
  // deck is on screen, so the landing never queues video ahead of the name and the posters.
  var deck = document.querySelector(".ld-deck");
  if (!deck) return;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ready = false, seen = true, order = [];
  function sync() {
    order.forEach(function (c, i) {
      var v = c.querySelector("video");
      if (!v) return;
      if (i === 0 && ready && seen && !still) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else if (!v.paused) v.pause();
    });
  }
  makeDeck(deck, ".file", document.querySelector(".ld-ctrl"), function (o) { order = o; sync(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; sync(); }, { rootMargin: "200px 0px" }).observe(deck);
  }
  function go() { ready = true; sync(); }
  if (document.readyState === "complete") go(); else window.addEventListener("load", go);
})();

(function () {
  // the size readout under the selected name, measured live
  var f = document.querySelector(".ld-frame"), z = document.querySelector(".ld-size");
  function put() { if (f && z) z.textContent = Math.round(f.offsetWidth) + " \u00d7 " + Math.round(f.offsetHeight); }
  put(); window.addEventListener("resize", put);
})();

(function () {
  // THE NUMBERS count up from zero once, as the page opens. Each figure's box is held at its
  // final width first, so nothing beside it shifts while it counts.
  var figs = document.querySelectorAll(".ld-fig[data-to]");
  if (!figs.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  figs.forEach(function (f) {
    var to = parseFloat(f.dataset.to), dec = Number(f.dataset.dec || 0), suf = f.dataset.suf || "", fin = f.textContent;
    f.style.minWidth = f.getBoundingClientRect().width + "px";
    f.textContent = (0).toFixed(dec) + suf;
    var t0 = performance.now() + 250, dur = 1500;
    requestAnimationFrame(function tick(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
      f.textContent = p < 1 ? (to * e).toFixed(dec) + suf : fin;
      if (p < 1) requestAnimationFrame(tick);
    });
  });
})();

(function () {
  // WORK HISTORY: one role open at a time. Its row is the paper card, so it opens top to
  // bottom. The + opens a role; the x on an open role closes it.
  var list = document.querySelector(".hist");
  if (!list) return;
  var items = [].slice.call(list.querySelectorAll(".hist-item"));
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // while one role closes and another opens, the page above the tapped role can shrink,
  // which would slide it up under the finger; this holds its header at the same screen
  // position until the motion ends, so it only ever opens downward
  function hold(el) {
    var y0 = el.getBoundingClientRect().top, start = performance.now(), end = start + 700;
    (function step(now) {
      if (window.__scrolledAt > start + 16) return;   // the visitor is scrolling: let go
      var d = el.getBoundingClientRect().top - y0;
      if (Math.abs(d) > 0.5) {
        var t = window.__scrolledAt;
        if (window.__lenis) window.__lenis.scrollTo(window.scrollY + d, { immediate: true });
        else window.scrollBy(0, d);
        window.__scrolledAt = t;
      }
      if (now < end) requestAnimationFrame(step);
    })(performance.now());
  }
  function set(it, byHover) {
    var anchor = it || list.querySelector(".hist-item.is-open");
    items.forEach(function (o) {
      var on = o === it;
      o.classList.toggle("is-open", on);
      o.querySelector(".hist-head").setAttribute("aria-expanded", on ? "true" : "false");
    });
    if (anchor && !byHover) hold(anchor.querySelector(".hist-head"));
  }
  items.forEach(function (it) {
    var head = it.querySelector(".hist-head");
    head.addEventListener("click", function () { set(it.classList.contains("is-open") ? null : it); });
    // on a mouse, pointing at a closed role still opens it; the x always closes
    if (fine) ["pointerenter", "pointermove"].forEach(function (t) {
      it.addEventListener(t, function () { if (!it.classList.contains("is-open") && !list.dataset.closed && !window.__scrolling()) set(it, true); });
    });
  });
  // after the x is used, hovering does not reopen anything until the pointer leaves the list
  list.addEventListener("click", function (e) { if (e.target.closest(".hist-item:not(.is-open)") && !list.querySelector(".is-open")) list.dataset.closed = "1"; });
  list.addEventListener("pointerleave", function () { delete list.dataset.closed; });
})();

(function () {
  // SWIPE ROWS (phones): the arrow buttons move a row by one item and grey out at each end.
  document.querySelectorAll(".row-nav").forEach(function (nav) {
    var row = document.getElementById(nav.getAttribute("data-row"));
    if (!row) return;
    var btns = nav.querySelectorAll("button");
    function step() { var a = row.children[0], b = row.children[1]; return b ? b.offsetLeft - a.offsetLeft : row.clientWidth; }
    btns.forEach(function (b) { b.addEventListener("click", function () { row.scrollBy({ left: step() * Number(b.dataset.dir) }); }); });
    function sync() {
      var max = row.scrollWidth - row.clientWidth - 2;
      btns[0].disabled = row.scrollLeft <= 2; btns[1].disabled = row.scrollLeft >= max;
    }
    row.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync); sync();
  });
})();


(function () {
  // THE PERSON: work out the ring of cells around the words (inside the outer row and column,
  // clear of the text). Mouse: a photo pops into a ring cell as the pointer enters it.
  // Touch or motion off: the photos are placed in the ring, spread out, and stay.
  var field = document.querySelector(".person-field");
  if (!field) return;
  var imgs = [].slice.call(field.querySelectorAll(".trail-img"));
  imgs.forEach(function (im) { if (im.decode) im.decode().catch(function () {}); });
  var words = [].slice.call(field.querySelectorAll(".person-copy > *"));
  var hover = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 761px)").matches &&
              !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ring = {}, ringList = [], cw = 0, ch = 0;
  function build() {
    cw = imgs[0].offsetWidth; ch = imgs[0].offsetHeight;
    var cols = Math.floor(field.clientWidth / cw + 0.01), rows = Math.floor(field.clientHeight / ch + 0.01);
    var b = field.getBoundingClientRect(), pad = 12;
    // the words themselves, not their full-width blocks
    var rects = words.map(function (w) { var rg = document.createRange(); rg.selectNodeContents(w); var r = rg.getBoundingClientRect(); return [r.left - b.left - pad, r.top - b.top - pad, r.right - b.left + pad, r.bottom - b.top + pad]; });
    ring = {}; ringList = [];
    // every row, but never the first or last column: nothing touches the sides of the site
    for (var y = 0; y < rows; y++) for (var x = 1; x < cols - 1; x++) {
      var l = x * cw, t = y * ch, r = l + cw, bt = t + ch;
      var under = rects.some(function (q) { return l < q[2] && r > q[0] && t < q[3] && bt > q[1]; });
      if (!under) { ring[x + "," + y] = 1; ringList.push([x, y]); }
    }
  }
  function spread() {
    imgs.forEach(function (im) { im.classList.remove("placed"); });
    var cells = ringList.slice(), taken = [];
    for (var i = cells.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)); var t = cells[i]; cells[i] = cells[k]; cells[k] = t; }
    imgs.forEach(function (img) {
      var c = null;
      for (var i = 0; i < cells.length && !c; i++) if (taken.every(function (o) { return Math.abs(o[0] - cells[i][0]) > 1 || Math.abs(o[1] - cells[i][1]) > 1; })) c = cells.splice(i, 1)[0];
      if (!c) c = cells.shift();
      if (!c) return;
      taken.push(c);
      img.style.left = c[0] * cw + "px"; img.style.top = c[1] * ch + "px";
      img.classList.add("placed");
    });
  }
  var n = 0, last = "", z = 1;
  if (hover) field.addEventListener("pointermove", function (e) {
    var b = field.getBoundingClientRect();
    var cx = Math.floor((e.clientX - b.left) / cw), cy = Math.floor((e.clientY - b.top) / ch), key = cx + "," + cy;
    if (key === last) return;
    last = key;
    if (!ring[key]) return;
    var img = imgs[n % imgs.length]; n++;
    img.classList.remove("pop"); void img.offsetWidth;
    img.style.left = cx * cw + "px"; img.style.top = cy * ch + "px"; img.style.zIndex = ++z;
    img.classList.add("pop");
  });
  if (hover) field.addEventListener("pointerleave", function () { last = ""; });
  var w = 0;
  function maybe() { if (field.clientWidth !== w) { w = field.clientWidth; build(); if (!hover) spread(); } }
  window.addEventListener("resize", maybe);
  if (document.readyState === "complete") maybe(); else window.addEventListener("load", maybe);
  maybe();
})();


(function () {
  // THE PAINTER'S PASS. Every headline on the page is brushed on left to right by the same
  // hand, once, when it is reached. This is the page's only entrance: nothing else animates
  // in, so it reads as one letterer at work rather than a dozen unrelated effects.
  var marks = document.querySelectorAll(".pass");
  if (!marks.length) return;
  function paint(el) { el.classList.add("painted"); }
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    marks.forEach(paint); return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { paint(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  marks.forEach(function (m) { io.observe(m); });
  // Safety net: these are headings, not decoration. If the observer never fires they must
  // not stay clipped to nothing. Five seconds is long past any real scroll.
  setTimeout(function () { marks.forEach(paint); }, 5000);
})();


(function () {
  // The scroll effects (name drift, smooth scroll) are served from this site and added after the
  // page, one after another, so they never hold it back: a visit landing on #contact jumps there
  // as soon as the card exists instead of waiting for this code.
  var files = ["assets/js/gsap.min.js", "assets/js/ScrollTrigger.min.js", "assets/js/lenis.min.js"];
  (function next(i) {
    if (i === files.length) { startMotion(); return; }
    var sc = document.createElement("script");
    sc.src = files[i];
    sc.onload = sc.onerror = function () { next(i + 1); };
    document.body.appendChild(sc);
  })(0);
})();

function startMotion() {
  // Depth on the painted backdrop. The two illustration plates share one scale so the figure
  // never ghosts against her own mask, and scaling rather than shifting means no gap can open
  // at the board's edges. The scrub triggers on the handbill's approach, because that is the
  // element whose travel actually corresponds to the hoarding leaving the screen.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.gsap || !window.ScrollTrigger) return;   // scripts failed: the name stays still
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    var lenis = new Lenis();
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
}

(function () {
  // In-page links glide rather than jump when Lenis owns the scroll.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    if (window.__lenis) {
      window.__lenis.scrollTo(t, { duration: 1.4, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
    } else {
      t.scrollIntoView({ behavior: "scrollBehavior" in document.documentElement.style ? "smooth" : "auto", block: "start" });
    }
    t.setAttribute("tabindex", "-1");
    t.focus({ preventScroll: true });
  });
})();




(function () {
  // Press notices: the two arrows scroll by exactly one notice and disable at each end so they
  // never look live when they would do nothing. Touch and trackpad work without any of this.
  var rail = document.getElementById("notice-rail");
  if (!rail) return;
  var track = rail.querySelector(".notice-track");
  var cards = track ? track.querySelectorAll(".notice") : [];
  if (cards.length < 2) return;
  function step() {
    var a = cards[0].getBoundingClientRect(), b = cards[1].getBoundingClientRect();
    return Math.round(b.left - a.left) || Math.round(a.width);
  }
  var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".rail-nav button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      rail.scrollBy({ left: step() * Number(btn.dataset.rail), behavior: smooth ? "smooth" : "auto" });
    });
  });
  function sync() {
    var max = rail.scrollWidth - rail.clientWidth - 2;
    document.querySelectorAll(".rail-nav button").forEach(function (btn) {
      btn.disabled = Number(btn.dataset.rail) < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max;
    });
  }
  rail.addEventListener("scroll", function () {
    if (sync.q) return;
    sync.q = 1;
    setTimeout(function () { sync.q = 0; sync(); }, 120);
  }, { passive: true });
  window.addEventListener("resize", sync);
  window.addEventListener("load", sync);
  sync();
})();


(function () {
  var btn   = document.querySelector('.menu-btn');
  var panel = document.getElementById('site-menu');
  var scrim = document.querySelector('.menu-scrim');
  if (!btn || !panel || !scrim) return;
  var closeBtn = panel.querySelector('.menu-close');
  var lastFocus = null;

  function items() { return panel.querySelectorAll('a[href], button'); }

  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('is-open');
    scrim.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var f = items(); if (f.length) f[0].focus();
    document.addEventListener('keydown', onKey);
  }

  function close() {
    panel.classList.remove('is-open');
    scrim.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';   /* clears the inline rule, not the stylesheet's */
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* Esc closes; Tab cycles inside the panel instead of escaping to the page behind it */
  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = items(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);

  /* a same-page anchor (#work, #contact) never reloads, so the panel must close itself */
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });

  /* rotating to landscape can cross the breakpoint and bring the real nav back */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && panel.classList.contains('is-open')) close();
  });

  panel.setAttribute('inert', '');
})();
