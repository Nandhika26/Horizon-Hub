HORIZON HUB v67 — BOOKING & ADMIN WORKFLOW ENHANCEMENT

Basis: HORIZON_HUB_v66_Admin_Visual_Fix.
This remains a frontend-only prototype. Demo data uses browser localStorage and is not synchronized across devices/users.

Changes in v67:
1. Admin dashboard action center now links separately to Room Booking Approval and Inventory Management, so the combined pending count does not lead to only one queue.
2. Admin quick actions include room management.
3. Inventory availability validation now considers the full requested period (start date/time through return date/time), not only the first date.
4. Pending, approved, borrowed, and overdue inventory loans reserve stock when their time periods overlap.
5. Admin approval rechecks stock across overlapping periods before approving.
6. Student inventory form shows live simulated stock availability for the selected item and requested period.
7. Inventory catalog labels stock as total simulated stock, avoiding an inaccurate universal availability figure without a selected date range.
8. Mark-all-read for admin notifications now includes both room and inventory approval notifications.
9. Student borrowing history combines room and inventory requests in newest-first chronological order.

Business rules retained:
- All room bookings require admin approval.
- Waiting room requests and approved room bookings reserve overlapping room time slots.
- Student cancellation of pending requests is allowed; approved bookings can be cancelled independently only at least 24 hours before start.
- Inventory use is restricted to campus locations.
- Inventory requests require admin approval and must be returned on schedule.
- Pending approvals are handled manually; no automatic expiry is implemented.
- No database/backend is connected.

Demo accounts:
- Student: mahasiswa / mhs123
- Admin: admin / admin123

Validation performed:
- JavaScript syntax check (node --check).
- ZIP integrity check.
- Static HTML duplicate-ID check.
- CSS link and local asset reference checks.

Not performed:
- Full browser / iPhone Safari interaction testing (local browser navigation was blocked by the test environment).
- Multi-user concurrency, server-side locking, database, and cross-device testing.
- Official room/inventory stock verification.
