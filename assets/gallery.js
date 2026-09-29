/* ============================================================
   GALLERY — data-driven Pinterest-style masonry + infinite loop
   ============================================================
   HOW TO ADD YOUR OWN IMAGES:
   Just add more objects to GALLERY_ITEMS below. Each image keeps
   its own natural width/height (portrait or landscape both work,
   the CSS-column masonry lays them out automatically). Once you
   scroll to the end of the array it loops back to item 0 again —
   forever — so you never "run out" of gallery content.
   ============================================================ */

const GALLERY_ITEMS = [
  
  { src: "assets/img2/petanitech.png", title: "PetaniTech Mobile", tag: "Mobile · Frontend . 2024", category: "developer" },
  { src: "assets/img2/flyer.png", title: "PetaniTech Website", tag: "Web · Full Stack . 2024", category: "developer" },
  { src: "assets/gallery/drafle.png", title: "Drafle Website", tag: "Web · Frontend . 2023", category: "developer" },
  { src: "assets/img2/webtl.png", title: "AI Machine Translation Model", tag: "Web · Thesis . 2026", category: "developer" },
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
];

(function () {
  const grid = document.getElementById("galleryGrid");
  const sentinel = document.getElementById("galSentinel");
  const loader = document.getElementById("galLoader");
  const filterBtns = document.querySelectorAll(".gal-filter");

  const BATCH_SIZE = 6;
  let activeFilter = "all";
  let pool = GALLERY_ITEMS;      // items matching the current filter
  let cursor = 0;                // index into `pool`, wraps with modulo
  let isLoading = false;
  let renderedCount = 0;

  function getPool(filter) {
    return filter === "all" ? GALLERY_ITEMS : GALLERY_ITEMS.filter(i => i.category === filter);
  }

  function buildCard(item, seq) {
    const el = document.createElement("div");
    el.className = "gal-item";
    el.dataset.seq = seq;
    el.innerHTML = `
      <img src="${item.src}" alt="${item.title}" loading="lazy">
      <div class="gal-item-overlay">
        <span class="gal-item-tag">${item.tag}</span>
        <span class="gal-item-title">${item.title}</span>
      </div>
    `;
    el.addEventListener("click", () => openLightbox(seq));
    return el;
  }

  function renderBatch() {
    if (isLoading || pool.length === 0) return;
    isLoading = true;
    loader.style.opacity = "1";

    // tiny delay so it feels like it's fetching the next batch
    setTimeout(() => {
      const frag = document.createDocumentFragment();
      const newNodes = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const item = pool[cursor % pool.length];
        cursor++;
        const node = buildCard(item, renderedCount++);
        newNodes.push(node);
        frag.appendChild(node);
      }

      grid.appendChild(frag);

      if (window.gsap) {
        gsap.to(newNodes, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
          onStart: () => gsap.set(newNodes, { y: 30 })
        });
      } else {
        newNodes.forEach(n => n.style.opacity = "1");
      }

      isLoading = false;
      loader.style.opacity = "0.25";
    }, 350);
  }

  function resetGrid(filter) {
    activeFilter = filter;
    pool = getPool(filter);
    cursor = 0;
    renderedCount = 0;
    grid.innerHTML = "";
    renderBatch();
  }

  // Infinite scroll — observes a sentinel just below the grid.
  // Because renderBatch() pulls from `pool` with `% pool.length`,
  // it naturally loops back to the first item once it reaches the end.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) renderBatch();
    });
  }, { rootMargin: "400px 0px 400px 0px" });
  observer.observe(sentinel);

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      resetGrid(btn.dataset.filter);
    });
  });

  // ---------------- Lightbox ----------------
  const lb = document.getElementById("galLightbox");
  const lbImg = document.getElementById("galLbImg");
  const lbTitle = document.getElementById("galLbTitle");
  const lbTag = document.getElementById("galLbTag");
  const lbClose = document.getElementById("galLbClose");
  const lbPrev = document.getElementById("galLbPrev");
  const lbNext = document.getElementById("galLbNext");

  let lbIndex = 0;

  function fillLightbox(seq) {
    // Map the rendered sequence number back to its source item
    const item = pool[seq % pool.length];
    lbImg.src = item.src;
    lbImg.alt = item.title;
    lbTitle.textContent = item.title;
    lbTag.textContent = item.tag;
  }

  function openLightbox(seq) {
    lbIndex = seq;
    fillLightbox(lbIndex);
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    if (window.gsap) {
      gsap.fromTo(".gal-lb-stage", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" });
    }
  }

  function closeLightbox() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }

  function stepLightbox(dir) {
    lbIndex += dir;
    if (lbIndex < 0) lbIndex = pool.length - 1;
    fillLightbox(lbIndex);
    if (window.gsap) {
      gsap.fromTo(lbImg, { opacity: 0.3, x: dir * 20 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
    }
  }

  lbClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  lbPrev.addEventListener("click", () => stepLightbox(-1));
  lbNext.addEventListener("click", () => stepLightbox(1));

  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  // ---------------- Hero entrance ----------------
  window.addEventListener("DOMContentLoaded", () => {
    if (window.gsap) {
      gsap.from(".gal-hero .section-label, .gal-hero-title, .gal-hero-sub, .gal-filters", {
        opacity: 0, y: 24, duration: 0.7, stagger: 0.1, ease: "power2.out", delay: 0.2
      });
    }
    resetGrid("all");
  });
})();
