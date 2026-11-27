/* Gallery wall. Data-driven masonry with filters, an endless loop and a lightbox.
   USE_REAL_IMAGES: false shows blue placeholder tiles. Set it to true once the original
   files are back in assets/gallery and assets/img2 (each item's `real` path below). */
const USE_REAL_IMAGES = true;
const GALLERY_ITEMS = [
  
  { src: "assets/img2/petanitech.png", title: "PetaniTech Mobile", tag: "Mobile · Frontend . 2024", category: "developer" },
  { src: "assets/img2/flyer.png", title: "PetaniTech Website", tag: "Web · Full Stack . 2024", category: "developer" },
  { src: "assets/gallery/drafle.png", title: "Drafle Website", tag: "Web · Frontend . 2023", category: "developer" },
  { src: "assets/gallery/dermayontl.png", title: "AI Machine Translation Model", tag: "Web · Thesis . 2026", category: "developer" },
  { src: "assets/img2/simwil.png", title: "SIMDES Laravel Migration", tag: "Web · Full Stack . 2025", category: "developer" },
  { src: "assets/gallery/ui-pocketify.png", title: "Pocketify App", tag: "UI/UX Design  . 2025", category: "developer" },
  { src: "assets/img2/portalgank.png", title: "PORTALGANK Website", tag: "UI/UX · Competition . 2024", category: "uiux" },
  { src: "assets/gallery/ui-gopack.png", title: "GOPACK App", tag: "UI/UX Design  . 2025", category: "uiux" },
  { src: "assets/gallery/ui-pocketify.png", title: "Pocketify App", tag: "UI/UX Design  . 2025", category: "uiux" },
  { src: "assets/gallery/ui-self-project.png", title: "Logic Game", tag: "UI/UX Design . 2026", category: "uiux" },
  { src: "assets/img2/melati.png", title: "Melati Nusantara Website", tag: "UI/UX Design . 2025", category: "uiux" },
  { src: "assets/gallery/riset.jpg", title: "Graphic Design Project", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/img2/flyer.png", title: "PetaniTech Website", tag: "Web · Full Stack . 2024", category: "design" },
  { src: "assets/gallery/riset2.jpg", title: "Graphic Design Project", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/gallery/putri-indrasari 1.png", title: "Graphic Design Project", tag: "Graphic Design", category: "design" },
  { src: "assets/gallery/OK.png", title: "Guide Poster", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/gallery/mbg1.png", title: "Social Media Content", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/gallery/mbg2.png", title: "Social Media Content", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/gallery/mbg3.png", title: "Social Media Content", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/gallery/mbg4.png", title: "Graphic Design Project", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/gallery/mbg5.png", title: "Graphic Design Project", tag: "Graphic Design . 2026", category: "design" },
  { src: "assets/gallery/manual book cover simwil.png", title: "Manual Book Cover", tag: "Graphic Design . 2025", category: "design" },
  { src: "assets/gallery/manual book cover dermayontl.png", title: "Manual Book Cover", tag: "Graphic Design . 2026", category: "design" },
  // { src: "assets/gallery/logo-final.png", title: "Graphic Design Project", tag: "Graphic Design", category: "design" },
  { src: "assets/gallery/logo portfolio.png", title: "Logo Design", tag: "Logo Design . 2025", category: "design" },
  { src: "assets/gallery/jastip.png", title: "Social Media Content", tag: "Graphic Design . 2025", category: "design" },
  { src: "assets/gallery/1.png", title: "Product Katalog Design", tag: "Graphic Design . 2024", category: "design" },
  { src: "assets/gallery/2.png", title: "Product Katalog Design", tag: "Graphic Design . 2024", category: "design" },
  { src: "assets/gallery/3.png", title: "Product Katalog Design", tag: "Graphic Design . 2024", category: "design" },
  { src: "assets/gallery/4.png", title: "Product Katalog Design", tag: "Graphic Design . 2024", category: "design" },
  { src: "assets/gallery/5.png", title: "Product Katalog Design", tag: "Graphic Design . 2024", category: "design" },
  { src: "assets/gallery/wed-invt.png", title: "Wedding Invitations", tag: "Web · Design . 2025", category: "uiux" },

];

(function () {
  const grid = document.getElementById("galleryGrid");
  const sentinel = document.getElementById("galSentinel");
  const box = document.getElementById("galLightbox");
  const lbImg = document.getElementById("galLbImg"), lbTag = document.getElementById("galLbTag"), lbTitle = document.getElementById("galLbTitle");
  const RATIOS = [[4, 5], [1, 1], [16, 10], [3, 4], [5, 4], [9, 16], [1, 1], [4, 3]];
  const TONES = [["#1C3F9E", "#0D1F5C", "#E84B3A"], ["#2952CC", "#122970", "#F0EDE4"], ["#0D1F5C", "#071D58", "#8FA9F5"], ["#122970", "#1C3F9E", "#E84B3A"]];
  const BATCH = 6;
  let filter = "all", pool = GALLERY_ITEMS, cursor = 0, seq = 0, shown = [], current = 0;

  function placeholder(i) {
    const r = RATIOS[i % RATIOS.length], w = r[0] * 100, h = r[1] * 100, t = TONES[i % 4];
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + t[0] + "'/><stop offset='1' stop-color='" + t[1] + "'/></linearGradient></defs><rect width='" + w + "' height='" + h + "' fill='url(#g)'/><circle cx='" + w * .72 + "' cy='" + h * .34 + "' r='" + Math.min(w, h) * .2 + "' fill='" + t[2] + "' opacity='.9'/><rect x='" + w * .12 + "' y='" + h * .6 + "' width='" + w * .42 + "' height='" + h * .08 + "' rx='" + h * .04 + "' fill='#F0EDE4' opacity='.85'/></svg>";
    return { src: "data:image/svg+xml," + encodeURIComponent(svg), w: w, h: h };
  }
  function build(item) {
    const p = placeholder(seq);
    const src = USE_REAL_IMAGES  ? (item.src || item.real) : p.src;
    const el = document.createElement("button");
    el.type = "button"; el.className = "gal-item"; el.dataset.idx = shown.length;
    el.innerHTML = '<img src="' + src + '" width="' + p.w + '" height="' + p.h + '" alt="' + (USE_REAL_IMAGES ? item.title : "Placeholder for " + item.title) + '" loading="lazy"><div class="cap"><b></b><span></span></div>';
    el.querySelector("b").textContent = item.title; el.querySelector("span").textContent = item.tag;
    el.addEventListener("click", function () { open(Number(el.dataset.idx)); });
    shown.push({ src: src, item: item }); seq++;
    return el;
  }
  function more() {
    for (let i = 0; i < BATCH; i++) {
      const el = build(pool[cursor % pool.length]); cursor++;
      grid.appendChild(el); requestAnimationFrame(function () { el.classList.add("in"); });
    }
  }
  function reset(f) {
    filter = f; pool = f === "all" ? GALLERY_ITEMS : GALLERY_ITEMS.filter(function (i) { return i.category === f; });
    grid.innerHTML = ""; cursor = 0; seq = 0; shown = []; more();
  }
  document.querySelectorAll(".gal-filter").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".gal-filter").forEach(function (x) { x.classList.toggle("active", x === b); });
      reset(b.dataset.filter);
    });
  });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) more(); }, { rootMargin: "600px 0px" }).observe(sentinel);
  else window.addEventListener("scroll", function () { if (innerHeight + scrollY > document.body.scrollHeight - 800) more(); }, { passive: true });

  function show(i) {
    current = (i + shown.length) % shown.length;
    const s = shown[current];
    lbImg.src = s.src; lbImg.alt = s.item.title; lbTitle.textContent = s.item.title; lbTag.textContent = s.item.tag;
  }
  function open(i) { show(i); box.classList.add("open"); box.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function close() { box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
  document.getElementById("galLbClose").addEventListener("click", close);
  document.getElementById("galLbPrev").addEventListener("click", function () { show(current - 1); });
  document.getElementById("galLbNext").addEventListener("click", function () { show(current + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  reset("all");
})();
