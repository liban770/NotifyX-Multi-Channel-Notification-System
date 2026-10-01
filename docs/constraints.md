# NotifyX — Technical & Operational Constraints

## 1. Runtime Environment Constraints
- **Platform**: Web platform operating in Google AI Studio / Cloud Run container environment.
- **Port**: Development server strictly binds to port 3000 (`0.0.0.0:3000`).
- **Angular Version**: Angular 21 with Zoneless change detection, native signals, and standalone components.
- **SSR & Express**: Handled via `@angular/ssr/node` and Express 5, serving both RESTful endpoints (`/api/v1/*`) and static Angular client bundles.
- **Worker Simulation**: In the single-container AI Studio preview environment, asynchronous queuing and worker consumption are coordinated via an internal memory/Redis event bus with true asynchronous promise ticks, exponential backoff, priority queues, and delivery attempt logging, while complete production Django + Celery + Redis architecture is provided in the `/backend` directory.

---

## 2. Channel Provider Constraints
- **External Network Access**: Sandboxed preview environments may block outgoing SMTP port 25/587 or require mock/simulated dispatch. All providers include robust simulation modes with realistic latency, delivery receipts, simulated carrier failures, and retry behavior so developers can test real-world failure handling immediately.
- **E.164 SMS Validation**: Recipient phone numbers must conform to the international standard (`+<country_code><number>`).
- **Quiet Hours**: Respect recipient timezones; queue notifications until window opens, unless priority is marked `CRITICAL`.
