- [x] Inspect backend auth registration controller and identify admin-role escalation restriction.
- [x] Inspect frontend registration role selection logic.
- [x] Plan edits (remove backend restriction only; keep adminOnly endpoints).
- [x] Remove backend guard that blocked assigning `role: admin` unless caller is already an admin.
- [ ] (Optional) Run backend/node checks and manual registration smoke test: create admin via role select, then verify admin endpoints.

