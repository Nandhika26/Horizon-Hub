HORIZON HUB v68 — INVENTORY SVG & DETAIL EXPERIENCE

Baseline: v67 Booking & Admin Enhancement
Mode: Frontend prototype; no online database/backend is connected.

What's updated:
1. Replaced placeholder square glyphs in inventory cards with category-specific inline SVG line icons (projector, speaker, microphone, camera, chair, table, cable/adapter).
2. Replaced the duplicated “Stok simulasi · Stok total simulasi” copy with a clearer stock summary: total stock, currently borrowed quantity, and availability now.
3. Added searchable inventory catalogs and category filters for student and admin views.
4. Added an inventory detail modal with description, stock breakdown, condition note, usage policy, and pickup-location note.
5. Uses the existing projector product photo in its detail view. Other items use matching SVG illustrations because the current project package does not include verified product photos for those assets.
6. Added a “Pilih untuk dipinjam” shortcut for students and a direct “Ajukan Peminjaman” action from the detail modal.
7. Kept existing localStorage-based demo stock and loan workflow; current availability is derived from active demo reservations for the current time.
8. Retained exactly two CSS files: style.css and custom.css. Cache versions bumped to v68.

Important:
- All stock and condition information is illustrative/demo data, not official campus inventory records.
- Data remains browser-local and is not shared across devices/users. Backend/database integration is a later phase.
- Real product photographs and verified pickup locations can replace the illustrations/placeholders once the campus asset list is confirmed.

Login demo credentials remain as defined in README_AUTH.txt.
