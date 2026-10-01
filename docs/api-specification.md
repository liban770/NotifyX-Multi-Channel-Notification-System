# NotifyX — RESTful API Specification (v1)

## Base URL
`/api/v1/`

All successful responses return JSON with status code `200` or `201`.
All error responses adhere to the standard error envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable explanation",
    "details": {}
  }
}
```

---

## 1. Authentication & Identity
- `POST /api/v1/auth/token/`
  - Body: `{ "email": "admin@notifyx.io", "password": "..." }`
  - Response: `{ "access": "<jwt>", "refresh": "<jwt>", "user": { ... } }`
- `POST /api/v1/auth/token/refresh/`
  - Body: `{ "refresh": "<jwt>" }`
- `GET /api/v1/auth/me/`
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ "user": { "id": "...", "email": "...", "role": "...", "organization": { ... } } }`
- `POST /api/v1/auth/switch-role/`
  - Body: `{ "role": "SUPER_ADMIN" | "ORG_ADMIN" | "STAFF_USER" }` (For interactive demo & testing)

---

## 2. Notification Dispatch & Management
- `POST /api/v1/notifications/send/`
  - Headers: `Authorization: Bearer <jwt>` OR `X-API-Key: nx_live_...`
  - Optional Header: `Idempotency-Key: <unique-uuid>`
  - Body:
    ```json
    {
      "event": "account.created",
      "recipient": "user@example.com",
      "channels": ["EMAIL", "PUSH", "IN_APP"],
      "priority": "HIGH",
      "data": {
        "user_name": "Ahmed",
        "account_name": "NotifyX Enterprise"
      },
      "scheduled_for": null
    }
    ```
  - Response (201 Created):
    ```json
    {
      "success": true,
      "dispatched_count": 3,
      "notifications": [
        {
          "id": "notif_9801",
          "channel": "EMAIL",
          "recipient": "user@example.com",
          "status": "QUEUED",
          "priority": "HIGH",
          "created_at": "2026-10-01T08:00:00Z"
        }
      ]
    }
    ```

- `POST /api/v1/notifications/bulk/`
  - Dispatch array of notification payloads in a single transaction.

- `GET /api/v1/notifications/`
  - Query params: `page`, `page_size`, `channel`, `status`, `recipient`, `search`, `priority`
  - Returns paginated notification summaries.

- `GET /api/v1/notifications/{id}/`
  - Returns notification details with all associated `delivery_attempts`.

- `POST /api/v1/notifications/{id}/retry/`
  - Re-enqueues a failed notification for another delivery attempt.

- `POST /api/v1/notifications/{id}/cancel/`
  - Cancels a scheduled or pending notification.

---

## 3. Template Management
- `GET /api/v1/templates/`
- `POST /api/v1/templates/`
  - Body:
    ```json
    {
      "name": "Welcome Onboarding",
      "notification_type": "account.created",
      "channel": "MULTI_CHANNEL",
      "subject_template": "Welcome to NotifyX, {{user_name}}!",
      "body_template": "Hello {{user_name}},\n\nYour account {{account_name}} is ready.",
      "channel_variants": {
        "SMS": "NotifyX: Welcome {{user_name}}! Account {{account_name}} active.",
        "PUSH": "Welcome aboard {{user_name}}!",
        "IN_APP": "Welcome to your new {{account_name}} workspace."
      },
      "required_variables": ["user_name", "account_name"]
    }
    ```
- `PUT /api/v1/templates/{id}/`
- `DELETE /api/v1/templates/{id}/`
- `POST /api/v1/templates/{id}/render-preview/`
  - Test variable interpolation with sample payload.

---

## 4. User Preferences
- `GET /api/v1/preferences/`
- `PUT /api/v1/preferences/`
  - Body:
    ```json
    {
      "email_enabled": true,
      "sms_enabled": false,
      "push_enabled": true,
      "in_app_enabled": true,
      "marketing_opt_in": false,
      "quiet_hours_enabled": true,
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "08:00",
      "timezone": "Africa/Mogadishu"
    }
    ```

---

## 5. Providers & Channels
- `GET /api/v1/providers/`
  - Lists all configured adapters (SMTP, SendGrid, Amazon SES, Twilio, FCM, In-App).
- `POST /api/v1/providers/test-connection/`
  - Performs synthetic ping to provider gateway.
- `PUT /api/v1/providers/{id}/`
  - Update credentials, failover priority, or toggle active status.

---

## 6. API Keys & Integration
- `GET /api/v1/api-keys/`
- `POST /api/v1/api-keys/`
  - Creates a new key, returns plaintext token once (`nx_live_...`), stores SHA-256 hash.
- `POST /api/v1/api-keys/{id}/rotate/`
- `DELETE /api/v1/api-keys/{id}/`

---

## 7. Analytics & Observability
- `GET /api/v1/analytics/overview/`
  - Total sent, delivered, failed, rate %, channel distribution, timeline series.
- `GET /api/v1/audit-logs/`
  - Paginated system audit trails.
- `GET /api/v1/queue/status/`
  - Active Redis queue backlog, worker heartbeat, throughput/sec.
