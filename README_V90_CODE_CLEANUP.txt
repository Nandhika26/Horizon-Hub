HORIZON HUB v90 — SAFE CODE CLEANUP

Based on v89 Mobile Bugfix.

Changes:
1. Removed the earlier duplicate declaration of renderStudentDirectory(). The later declaration was the effective implementation because duplicate function declarations in the same scope are resolved by the later declaration. The effective implementation was retained unchanged.
2. Removed 5 exact duplicate CSS rules in custom.css (same selector and same declarations in the same stylesheet scope).
3. Removed 1 exact duplicate CSS rule in style.css.
4. Updated CSS/JS cache query versions to v90 so browsers request the updated files.

Not changed:
- CSS rules with the same selector but different declarations were retained because they may be intentional responsive or version-specific overrides.
- No broad JavaScript refactor or feature logic changes were made.
- Existing mobile fixes from v89 were retained.

Validation:
- JavaScript syntax checked with Node.js --check.
- CSS parsed with tinycss2 with no parse errors.
- Please test the main flows in browser preview, including student/admin navigation, planner, calendar, booking, and profile.
