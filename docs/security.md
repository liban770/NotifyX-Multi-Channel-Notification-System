# NotifyX — Security Architecture & Threat Modeling

## 1. Authentication & Authorization
- **JWT Standard**: Tokens signed with HS256/RS256, carrying user ID, organization ID, and role. Token expiration set to 15 minutes for access tokens and 7 days for rotating refresh tokens.
- **API Key Security**:
  - API keys use the format `nx_live_<prefix>_<entropy>`.
  - The entropy is never stored directly in the database. Instead, only a one-way `SHA-256` hash is stored.
  - Verification compares the hash of the supplied header key with the stored hash using constant-time string comparison (`crypto.timingSafeEqual` in Node / `hmac.compare_digest` in Python) to prevent timing attacks.
  - Keys have granular scopes: `notifications.send`, `notifications.read`, `templates.read`, `templates.write`, `analytics.read`.
- **Role-Based Access Control (RBAC)**:
  - Super Admin: global read/write across all tenants.
  - Org Admin: scoped to tenant organization.
  - Staff: scoped to sending, viewing, and testing notifications.
  - Recipient: restricted to their own preference profile and in-app messages.

---

## 2. Data Protection & Secrets
- **Zero Plaintext Secrets**: Vendor secrets (SendGrid API key, Twilio Auth Token, FCM service account JSON) are encrypted at rest using AES-256-GCM.
- **PII Scrubbing**: Logs mask recipient identifiers (e.g. `ah***@example.com` or `+1***456`) in audit logs and monitoring streams unless explicitly authorized by compliance roles.
- **SQL Injection Prevention**: All queries use parameterized ORM queries (Django ORM / parameterized SQL). No string interpolation in queries.
- **Cross-Site Scripting (XSS)**: Angular template sanitization and DOMPurify prevent arbitrary script injection in HTML email previewers.

---

## 3. Denial of Service & Abuse Protections
- **Token Bucket Rate Limiting**: Enforced per IP and per API Key (default: 1,000 req/min for standard clients, 5,000 req/min for enterprise).
- **Idempotency Locks**: Redis atomic keys ensure duplicate client retries within a 5-minute window do not trigger duplicate SMS or Email sends.
- **Payload Size Caps**: Maximum notification payload limited to 256 KB.
