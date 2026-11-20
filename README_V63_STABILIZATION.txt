HORIZON HUB v63 — STABILIZATION UPDATE

Basis: v62 Profile Icon Refinement. Existing pages and features are retained.

Changes:
1. Consolidated authoritative bookable-floor and classroom-code data into BOOKABLE_FLOORS and OFFICIAL_CLASSROOMS.
2. Booking floor selectors now use the same source of truth. West Building floor 3 is not offered in classroom booking because the current verified classroom list contains no room codes for that floor. East Building floors 2–5 remain bookable; floors 6–10 remain directory-only until official layout/booking data is supplied.
3. Map detail booking eligibility now checks the same approved-floor list.
4. If a selected room is not part of the currently selected building/floor's authoritative room list, the stale selection is cleared.
5. Added a focused CSS containment layer for the booking form, grid tracks, labels, and native date/time controls, with mobile spacing adjustments.
6. Updated stylesheet cache key to v63.

Verification performed: JavaScript syntax check, ZIP integrity check, static duplicate-ID scan, and static checks for referenced IDs.
Not performed: interactive browser testing or iPhone Safari visual testing.

Important: this remains a localStorage prototype. No backend, centralized authentication, or cross-device synchronization was added. Capacities and room facilities remain unconfirmed unless entered by admin.
