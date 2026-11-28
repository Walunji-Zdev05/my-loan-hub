# Staff authentication reconciliation

- [x] Inspect available branch/history and preserve current LMS routes.
- [x] Make sign-in staff-only with secure role loading and fail-closed redirects.
- [x] Add admin-only Staff Management page, navigation, invite form, and directory states.
- [x] Add secure `invite-staff` and `list-staff` Edge Functions with built-in JWT verification.
- [x] Verify role rules, typecheck/build, and test safe unauthenticated/error paths without inviting anyone.
- [x] Report deployment, origin configuration, commit, and preview status.

Deployment and `APP_ALLOWED_ORIGINS` configuration remain pending user confirmation; no real invitation may be sent.
