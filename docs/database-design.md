# NotifyX — Database Schema Design (PostgreSQL)

## 1. Entity-Relationship Overview

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  organizations  │───1:N─│      users      │───1:1─│ user_preferences│
└────────┬────────┘       └────────┬────────┘       └─────────────────┘
         │                         │
         ├───1:N───────────────────┼───1:N───┐
         │                         │         │
         ▼                         ▼         ▼
┌─────────────────┐       ┌───────────────────────────┐
│   api_clients   │       │   audit_logs              │
└────────┬────────┘       └───────────────────────────┘
         │
         ├───1:N───────────┐
         ▼                 ▼
┌─────────────────┐  ┌───────────────────┐
│    api_keys     │  │  templates        │
└─────────────────┘  └─────────┬─────────┘
                               │
                               ├───1:N───────────┐
                               ▼                 ▼
                     ┌───────────────────┐ ┌─────────────┐
                     │   notifications   │ │  schedules  │
                     └─────────┬─────────┘ └─────────────┘
                               │
                               ├───1:N───┐
                               ▼         ▼
                     ┌───────────────────────┐
                     │   delivery_attempts   │
                     └───────────────────────┘
```

---

## 2. Table Definitions & DDL

### `organizations`
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'enterprise',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF_USER', 'RECIPIENT')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_users_org ON users(organization_id);
```

### `user_preferences`
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    security_alerts_opt_in BOOLEAN DEFAULT TRUE,
    transactional_opt_in BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(100) DEFAULT 'UTC',
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `provider_configurations`
```sql
CREATE TABLE provider_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    provider_type VARCHAR(50) NOT NULL, -- e.g. 'SENDGRID', 'AWS_SES', 'TWILIO', 'FCM', 'IN_APP_LOCAL'
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 1,
    credentials_encrypted JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    health_status VARCHAR(50) DEFAULT 'HEALTHY',
    last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_provider_configs_org_channel ON provider_configurations(organization_id, channel);
```

### `templates`
```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- e.g. 'ACCOUNT_CREATED', 'SECURITY_ALERT', 'PAYMENT_REMINDER'
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'MULTI_CHANNEL')),
    subject_template VARCHAR(255),
    body_template TEXT NOT NULL,
    channel_variants JSONB DEFAULT '{}', -- specific overrides for SMS, Push, In-App
    required_variables JSONB DEFAULT '[]', -- e.g. ["user_name", "account_name"]
    version INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_templates_org_type ON templates(organization_id, notification_type);
```

### `notifications`
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notification_type VARCHAR(100) NOT NULL,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    priority VARCHAR(50) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    idempotency_key VARCHAR(255),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_notifs_org_status ON notifications(organization_id, status);
CREATE INDEX idx_notifs_recipient ON notifications(recipient);
CREATE INDEX idx_notifs_created ON notifications(created_at DESC);
CREATE INDEX idx_notifs_idempotency ON notifications(organization_id, idempotency_key);
```

### `delivery_attempts`
```sql
CREATE TABLE delivery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    http_status_code INT,
    provider_message_id VARCHAR(255),
    raw_response JSONB DEFAULT '{}',
    error_details TEXT,
    execution_time_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_attempts_notification ON delivery_attempts(notification_id);
```

### `api_clients` & `api_keys`
```sql
CREATE TABLE api_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of plaintext key
    scopes JSONB NOT NULL DEFAULT '["notifications.send", "notifications.read"]',
    rate_limit_per_minute INT DEFAULT 1000,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_api_keys_lookup ON api_keys(key_prefix, is_revoked);
```

### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_audit_org_time ON audit_logs(organization_id, created_at DESC);
```
