HORIZON HUB v91 — STUDENT PHOTO CAROUSEL + SAFE OPTIMIZATION

Based on the user-uploaded v90 ZIP.

Homepage:
- Replaced the generated campus banner in the student dashboard with a four-photo carousel using the user's supplied student photos.
- Added gentle crossfade, slow zoom, four position indicators, manual dot selection, and automatic rotation every 5.6 seconds.
- Added reduced-motion support and pause/resume behavior on hover / hidden tab.
- Responsive composition uses a taller mobile ratio to reduce awkward cropping; images use object-fit: cover.
- The four original photos were resized and converted to WebP (quality 83) for faster loading.

Cleanup:
- Removed the old horizon-campus-banner.png asset (2.4 MB) because it was no longer referenced by index.html, style.css, custom.css, or script.js.
- Kept the existing v90 JavaScript/CSS deduplication; no broad refactor of feature logic was made.
- Kept responsive CSS overrides that differ because they may be intentional.
- Updated CSS cache versions to v91.

Validation:
- Node.js syntax check: passed.
- CSS parsing (style.css and custom.css): no parse errors.
- Exact duplicate file-content scan: none found in original v90 ZIP.
- Manual browser interaction / Netlify deployment testing has not been performed. Please preview student dashboard on iPhone and desktop, and verify login, planner, calendar, booking, inventory, and admin flows.

Manual navigation fix (v91.1): added horizontal swipe handling for iPhone/Android touch screens and mouse drag on desktop. Vertical page scrolling remains enabled.
