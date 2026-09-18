# BackupOps — Authentication & Session Architecture

## 1. Overview & Security Principles

BackupOps implements a production-grade, secure, control-plane authentication and session lifecycle system.

### Core Principles
- **No Plaintext Passwords**: Passwords are salted and hashed using bcrypt (10 rounds) before persistence.
- **No Client Secrets**: Credentials and passwords are never exposed through API responses or stored in frontend code.
- **Server Bootstrap Configuration**: Initial administrative credentials are supplied securely via server environment variables:
  ```env
  ADMIN_EMAIL=admin@gmail.com
  ADMIN_PASSWORD=admin@123
  ```
  On first system initialization / migration startup, the application verifies whether an administrative account exists. If not, it provisions the initial administrator (`admin@gmail.com`), hashes the bootstrap password, establishes the default workspace organization (`default`), and links super-administrator membership.
- **Stateless JWT with Protected API Endpoints**: All API routes except `/api/v1/auth/login` and `/api/v1/health` are protected server-side by `JwtAuthGuard`.

---

## 2. Server-Side Authentication Architecture

### 2.1 Password Hashing & Case-Insensitive Lookup
In `apps/api/src/modules/auth/auth.service.ts`:
- Login lookup uses `LOWER(user.email) = LOWER(:email)` ensuring consistent sign-in regardless of client casing.
- The `passwordHash` field is marked with `select: false` on the `User` entity to prevent accidental serialization in user lists, queries, or logs. It is explicitly queried via `.addSelect('user.passwordHash')` solely during credential verification.
- Passwords are validated using `bcrypt.compare(password, user.passwordHash)`.

### 2.2 JWT Token Payload & Organization Context
Upon successful credential validation:
```typescript
interface JwtPayload {
  sub: string;             // User UUID
  email: string;           // Normalized email
  organizationId: string;  // Active organization context
  roles: string[];         // User permissions
}
```
The token is signed using `JWT_SECRET` with configurable expiration (default `24h`).

### 2.3 Global JWT Guard
Registered in `apps/api/src/modules/auth/auth.module.ts` as an `APP_GUARD`:
```typescript
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
}
```
Public endpoints are explicitly annotated using the `@Public()` decorator. Every resource operation enforces tenant isolation (`organizationId`) and user identity.

---

## 3. Client-Side Authentication & Session Management

### 3.1 Token Storage & HTTP Request Interception
In `apps/web/src/context/AuthContext.tsx` and `apps/web/src/services/api.ts`:
- Tokens are stored in browser `localStorage` as `backup_ops_jwt`.
- The API client automatically attaches the `Authorization: Bearer <token>` header to all outgoing requests.
- Axios interceptor detects `401 Unauthorized` responses and triggers session invalidation only on genuinely unauthenticated requests, clearing local state and cleanly navigating to `/login`.

### 3.2 Protected Route Guards
In `apps/web/src/components/auth/ProtectedRoute.tsx`:
- Wrapped around all application routes (`/overview`, `/infrastructure/*`, `/databases/*`, `/storage`, `/backups`, `/restore`, `/operations`, `/monitoring`, `/notifications`, `/settings`).
- If `isAuthenticated` is `false`, renders `<Navigate to="/login" replace />` and stores the previous attempted path.
- Once authenticated, renders `<Outlet />` or wrapped children.

### 3.3 Login Interface UX
- Email and password inputs with field-level validation.
- Show / Hide password visibility toggle.
- Loading states preventing duplicate submission.
- Real error notifications for invalid credentials, connection failure, and server timeouts.
- Clean logout handling that invalidates the local session and redirects to `/login`.
