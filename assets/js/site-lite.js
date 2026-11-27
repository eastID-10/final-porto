if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) { window.scrollTo(0, 0); window.addEventListener("load", function () { window.scrollTo(0, 0); if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); }); }

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
