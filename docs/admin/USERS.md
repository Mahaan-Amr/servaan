### Admin Users Management

Endpoints base: `/api/admin/users`

RBAC:
- List: SUPER_ADMIN, PLATFORM_ADMIN
- Create/Update Role/Activate/Reset Password: SUPER_ADMIN

Endpoints:
- GET `/` — query: `page`, `limit`, `search?`, `role? (ALL|SUPER_ADMIN|PLATFORM_ADMIN|SUPPORT|DEVELOPER)`, `isActive? (all|true|false)`
- POST `/` — body: `{ email: string, password: string, role: 'SUPER_ADMIN'|'PLATFORM_ADMIN'|'SUPPORT'|'DEVELOPER' }`
- PUT `/:id/role` — body: `{ role }`
- PUT `/:id/active` — body: `{ isActive: boolean }`
- POST `/:id/reset-password` — body: `{ newPassword: string }`

Frontend:
- Page: `/admin/users` — RTL/Farsi, search, role/status filters, pagination
- Actions: create user, change role, activate/deactivate, reset password

Notes:
- Passwords are hashed with bcrypt using `ADMIN_BCRYPT_ROUNDS`
- Consider enabling 2FA for critical roles in a next step


