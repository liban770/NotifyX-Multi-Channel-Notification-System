# NotifyX — Product Definition

## 1. Executive Summary
**NotifyX** is a centralized, enterprise-grade multi-channel notification orchestration platform designed to streamline dispatching, tracking, scheduling, and observing transactional and marketing communications across modern applications.

NotifyX decouples application business logic from underlying communication vendors (such as SendGrid, AWS SES, Twilio, Firebase Cloud Messaging, and WebSockets/In-App delivery) through a standardized provider abstraction layer, asynchronous queue processing, variable-aware template rendering, user preference evaluation, and strict audit logging.

---

## 2. Core Capabilities & Supported Channels

NotifyX natively abstracts four foundational communication mediums:
1. **Email Channel**: High-throughput transactional and newsletter delivery with HTML/Markdown rendering, fallback delivery providers (e.g. primary SendGrid with AWS SES fallback), open tracking, and DKIM/SPF alignment.
2. **SMS Channel**: Global mobile messaging supporting international E.164 formats, rate-limiting, sender ID customization, and automated failover between Twilio and local carrier gateways.
3. **Push Notifications**: Mobile and Web Push powered by Firebase Cloud Messaging (FCM) and Web Push (VAPID), supporting custom payloads, deep links, badge counts, and TTL expiry.
4. **In-App Notifications**: Real-time notifications delivered directly to active web/mobile client sessions via WebSocket/SSE and persisted in client inboxes with read/unread tracking and actionable links.

---

## 3. High-Level System Architecture

```text
External Client / SDK / UI
         │
         ▼  (REST API with JWT or API Key 'nx_live_...')
┌────────────────────────────────────────────────────────┐
│                   NotifyX Gateway                      │
│   - Rate Limiter & Token Bucket                        │
│   - Authentication (JWT / API Key Scopes)              │
│   - Request Schema Validation & Idempotency Key Check  │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│             Notification Orchestrator                  │
│   - Preference Engine (Quiet Hours, Opt-outs)          │
│   - Template Engine (Liquid / Mustache Syntax)         │
│   - Channel Matrix Resolver                            │
└────────────────────────┬───────────────────────────────┘
                         │ (Persists 'PENDING' / 'QUEUED')
                         ▼
┌────────────────────────────────────────────────────────┐
│             Message Broker (Redis Queue)               │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│              Celery Workers / Dispatchers              │
│   - Idempotent Execution Worker                        │
│   - Provider Adapter Invocation                        │
│   - Circuit Breaker & Exponential Backoff Retry        │
└────────────┬─────────────┬─────────────┬───────────────┘
             │             │             │
             ▼             ▼             ▼
      ┌────────────┐┌────────────┐┌────────────┐
      │Email Adaptr││SMS Adapter ││Push Adapter│
      │(SES/SendG) ││ (Twilio)   ││   (FCM)    │
      └────────────┘└────────────┘└────────────┘
```

---

## 4. User Personas & Role-Based Access Control (RBAC)

1. **Super Admin**:
   - Platform-wide governance across all tenant organizations.
   - Provider pool configuration, secrets management, and global rate limits.
   - Global audit logs and cluster health diagnostics.

2. **Organization Admin**:
   - Tenant isolation, team member invitations, and role management.
   - Template authoring, variable schema definitions, and channel routing rules.
   - API client key generation, rotation, and revocation.
   - Aggregated delivery analytics and failure inspection.

3. **Staff / Dispatcher**:
   - Authorized notification triggering, bulk campaign dispatch, and schedule management.
   - Real-time delivery logs, retry trigger permissions, and delivery attempt inspections.

4. **End User / Recipient**:
   - Notification preference center (channel opt-ins, quiet hours, timezone adjustments).
   - In-app notification center inbox.
