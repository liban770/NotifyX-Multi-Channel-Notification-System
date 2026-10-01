# NotifyX — Technical Architecture & System Design

## 1. Architectural Philosophy
NotifyX is built upon principles of **Hexagonal Architecture (Ports and Adapters)**, **Domain-Driven Design (DDD)**, and **Eventual Consistency via Asynchronous Queuing**.

### Key Tenets:
1. **Asynchronous Non-Blocking Ingestion**: The HTTP API layer strictly accepts requests, evaluates validation & authorization, stores a pending record, and enqueues a background message. HTTP handlers never block waiting for third-party network I/O.
2. **Pluggable Provider Abstraction**: Channels define contract interfaces (`BaseEmailProvider`, `BaseSMSProvider`, `BasePushProvider`). Vendor-specific implementations translate internal normalized payloads to third-party API payloads.
3. **Delivery Attempt Traceability**: Notifications maintain a parent record with 1-to-N `DeliveryAttempt` child records. Every retry, status code, latency, and raw gateway response is permanently auditable.
4. **Idempotency Guarantees**: Every dispatch request may supply an `Idempotency-Key` header (or generated hash of `recipient + event + deduplication_window`) stored in Redis with atomic `SETNX`.
5. **Preference & Guardrail Interception**: Before enqueuing delivery, the engine cross-references recipient preference policies (Opt-out status, quiet hours converted to recipient local timezone) unless marked `CRITICAL_SECURITY`.

---

## 2. Component Topology

```text
               ┌───────────────────────┐
               │    Angular 21 Client  │
               │ (Zoneless, Signals)   │
               └───────────┬───────────┘
                           │ HTTPS / WSS
                           ▼
               ┌───────────────────────┐
               │   API Gateway / Nginx │
               └───────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
   ┌──────────────────┐        ┌──────────────────┐
   │  Django / DRF    │        │  Node / SSR      │
   │  Application API │        │  Edge Ingestion  │
   └─────────┬────────┘        └─────────┬────────┘
             │                           │
             ├─────────────┬─────────────┤
             ▼             ▼             ▼
      ┌────────────┐┌────────────┐┌────────────┐
      │ PostgreSQL ││   Redis    ││ Structured │
      │ 16 Primary ││Broker/Cache││ Cloud Logs │
      └────────────┘└──────┬─────┘└────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Celery Workers  │
                  │ (Prefetch = 1)  │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │SMTP/SendGrid│  │Twilio SMS   │  │ Firebase FCM│
   │   Cluster   │  │   Gateway   │  │ Cloud API   │
   └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 3. Provider Abstraction Model

### Channel Provider Interface
```typescript
interface NotificationProvider<TPayload, TResponse> {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  name: string;
  isHealthy(): Promise<boolean>;
  send(payload: NormalizedNotificationPayload): Promise<ProviderSendResult>;
}
```

### Provider Failover & Circuit Breaking
When a provider encounters 3 consecutive timeouts or 5xx server errors, the circuit flips to `OPEN` state for 60 seconds, and the channel router automatically delegates pending delivery attempts to the configured secondary provider (e.g., SendGrid -> Amazon SES).

---

## 4. Scheduling & Cron Architecture
- **Timezone-Aware Cron Schedules**: Evaluated every minute via Celery Beat or background scheduler.
- **Dynamic Scheduled Dispatch**: When `scheduled_for` is in the future, jobs are either pushed to Celery with an `eta` timestamp or held in a `SCHEDULED` status index table picked up by a high-frequency polling worker.
- **Cancellation**: Scheduled records can be cancelled up until `processing_started_at` is flagged.

---

## 5. Security & Isolation Model
- Multi-tenancy enforced at the ORM model level: all transactional entities have a foreign key to `Organization`.
- User requests carry JWT claims with `org_id` and `role`. Queries strictly apply `.filter(organization_id=request.user.organization_id)` unless caller possesses `SUPER_ADMIN` platform privileges.
- API Key authentication uses SHA-256 key hashing (`prefix + '.' + secret_entropy`), verified against hashed values in the database.
