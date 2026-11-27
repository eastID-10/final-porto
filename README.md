# Easti Damayanti, portfolio

Plain static site (HTML, CSS, vanilla JS). No build step, no framework. Push the contents of this folder to the root of your GitHub Pages repo.

Preview locally: `python3 -m http.server 8080` then open http://localhost:8080

## Files
- index.html: landing (name, case-file deck), toolkit band, work experience, contact, gallery teaser
- 6 case study pages: indramayu-translation, melati-nusantara, pocketify, portalgank, polindra-toefl, wedding-invitation
- about.html, gallery.html (+ gallery.js)
- site.css (main styles), pages.css (case study, about, gallery), site.js, site-lite.js
- fonts/ (Staatliches, Manrope, self-hosted), js/ (gsap, ScrollTrigger, Lenis smooth scroll)
- assets/logo.png, assets/Easti_Damayanti_CV.pdf

## Replacing placeholders
- Every placeholder image is an inline SVG `<img>` whose alt text starts with "Placeholder". Swap the `src` for your file and rewrite the alt text.
- Gallery: put your original images back in assets/gallery and assets/img2, then set `USE_REAL_IMAGES = true` at the top of gallery.js.

## Colours (site.css :root)
cobalt `#1C3F9E` (landing field, buttons), navy `#071D58` / `#0D1F5C` (frame, footer, text), blue `#2952CC` (links, hover), cream `#F0EDE4` (paper), coral `#E84B3A` (small accents).
