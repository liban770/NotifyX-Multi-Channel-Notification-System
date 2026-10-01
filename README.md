# NotifyX — Multi-Channel Enterprise Notification Platform

NotifyX is a high-throughput, fault-tolerant notification management engine decoupling core business logic from external communication gateways (Email via SendGrid/SES, SMS via Twilio, Push via Firebase Cloud Messaging, and Web In-App delivery).

---

## 1. Quickstart with Docker Compose

Run the entire cluster (PostgreSQL 16, Redis 7, Django REST API, Celery Workers, Celery Beat):

```bash
cd backend
docker-compose up --build -d
```

Verify services:
```bash
docker-compose ps
```

---

## 2. Environment Variables

Configure your `.env` based on `.env.example`:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/notifyx_db` |
| `REDIS_URL` | Redis message broker URI | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL`| Celery task queue broker | `redis://localhost:6379/0` |
| `SENDGRID_API_KEY` | SendGrid Gateway Key | `SG.xxxxxxxxxx` |
| `TWILIO_ACCOUNT_SID`| Twilio Account SID | `ACxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN`| Twilio Secret Token | `xxxxxxxxxxxxxx` |
| `FIREBASE_CREDENTIALS`| Service account JSON path | `/secrets/firebase.json` |

---

## 3. Celery Asynchronous Workers

Launch workers listening on prioritized queues:

```bash
# High-priority queue worker (Security OTPs, Password Resets)
celery -A config worker -Q high_priority -c 4 --loglevel=info

# Default transactional queue worker
celery -A config worker -Q default -c 4 --loglevel=info

# Bulk newsletter & marketing queue worker
celery -A config worker -Q bulk -c 2 --loglevel=info
```

---

## 4. RESTful API Endpoints

- `POST /api/v1/auth/token/` - JWT Login
- `POST /api/v1/notifications/send/` - Enqueue asynchronous notification job
- `POST /api/v1/notifications/bulk/` - Enqueue bulk campaign batch
- `GET /api/v1/notifications/` - List & filter notifications
- `GET /api/v1/notifications/<id>/` - Inspect lifecycle & delivery attempt timeline
- `POST /api/v1/notifications/<id>/retry/` - Manually trigger retry for failed jobs
- `GET /api/v1/templates/` - Notification templates library
- `POST /api/v1/templates/<id>/render-preview/` - Test Mustache variable interpolation
- `GET /api/v1/providers/` - Provider health & circuit breaker failover matrix
- `GET /api/v1/preferences/` - Recipient channel preferences & quiet hours
- `GET /api/v1/api-keys/` - Manage API client keys & scopes
- `GET /api/v1/analytics/overview/` - Throughput, success rates, provider latencies
- `GET /api/v1/queue/status/` - Celery queue depth & worker diagnostics
