HORIZON HUB v65 — CAMPUS SERVICES WORKFLOW PROTOTYPE

Basis: HORIZON_HUB_v64_Hybrid_Visual_Refresh (v63 stabilization + v64 visual refresh).

This version remains a FRONTEND PROTOTYPE. It does not connect to a database, backend API, or centralized authentication. Demo data is stored in the current browser's localStorage and is not synchronized between devices or browsers.

V65 changes:
1. Added a separate student menu and page for Peminjaman Inventaris.
2. Added a student inventory request form with quantity, usage date/time, return date/time, on-campus location, and purpose.
3. Added a demo inventory catalog with explicitly simulated stock values. These are not official university inventory counts.
4. Added admin inventory management sections for pending approvals, approved items awaiting pickup, items currently borrowed, and recorded returns.
5. Added admin workflow: Waiting Approval -> Disetujui (ready for pickup) -> Dipinjam -> Dikembalikan. Rejected and Overdue states are also supported.
6. Added inventory stock validation for demo data and cancellation for pending requests / approved requests at least 24 hours before use.
7. Added student room-booking cancellation. Pending requests may be cancelled; approved bookings may be cancelled by students only at least 24 hours before start time.
8. Cancelled room requests release their time slots. Waiting and approved room requests block overlapping time slots.
9. Room availability labels distinguish Waiting Approval and Booked.
10. Admin approval checks overlapping requests again before approval.
11. Added local booking activity logs for status transitions.
12. Added inventory request notifications to student/admin notification centers.
13. Corrected Thursday ICT 002 / Pemrograman Dasar room label to Lab Comp 2 so the schedule card matches its detail modal.
14. Added responsive styling for the new workflow sections.

Demo accounts:
- Student: mahasiswa / mhs123
- Admin: admin / admin123

Important behavior:
- Pending room requests reserve their slot until admin approval/rejection/cancellation. No automatic pending timeout is implemented; admin must process pending requests manually.
- All inventory lending is restricted to campus locations in the prototype form.
- The 24-hour cancellation policy is enforced for approved room/inventory requests. Pending requests can be cancelled directly.
- Admin actions and data changes only affect the local browser storage.
- Demo inventory counts and sample room/capacity records must not be represented as verified official campus data.

Validation performed for this package:
- JavaScript syntax check (node --check).
- ZIP integrity check.
- Static HTML duplicate-ID check.
- Static navigation target check.
- Static local asset reference check.

Not performed:
- Full interactive browser / iPhone Safari testing (the local browser test environment blocked page navigation).
- Backend, database, multi-user concurrency, and cross-device tests.

Next phase before database integration:
1. Complete interactive testing on iPhone and desktop.
2. Review role permissions and all edge cases with the project team.
3. Confirm official room, capacity, and inventory master data with the university.
4. Finalize database schema and API contracts only after prototype flows are approved.
