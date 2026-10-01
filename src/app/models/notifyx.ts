export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type NotificationStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED' | 'SCHEDULED';
export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'STAFF_USER' | 'RECIPIENT';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserPreference {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  marketingOptIn: boolean;
  securityAlertsOptIn: boolean;
  transactionalOptIn: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  preferredLanguage: string;
}

export interface ProviderConfig {
  id: string;
  channel: NotificationChannel;
  providerType: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  lastPingMs: number;
  settings: Record<string, any>;
}

export interface Template {
  id: string;
  organizationId: string;
  notificationType: string;
  name: string;
  channel: NotificationChannel | 'MULTI_CHANNEL';
  subjectTemplate: string;
  bodyTemplate: string;
  channelVariants: {
    EMAIL?: string;
    SMS?: string;
    PUSH?: string;
    IN_APP?: string;
  };
  requiredVariables: string[];
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  updatedAt: string;
}

export interface DeliveryAttempt {
  id: string;
  notificationId: string;
  attemptNumber: number;
  channel: string;
  providerName: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  httpStatusCode?: number;
  providerMessageId?: string;
  rawResponse: Record<string, any>;
  errorDetails?: string;
  executionTimeMs: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  recipient: string;
  recipientUserId?: string;
  notificationType: string;
  templateId?: string;
  channel: NotificationChannel;
  subject: string;
  content: string;
  metadata: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  idempotencyKey?: string;
  scheduledFor?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyItem {
  id: string;
  clientId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  maskedSecret: string;
  scopes: string[];
  rateLimitPerMinute: number;
  lastUsedAt?: string | null;
  isRevoked: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  organizationId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface InAppMessage {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  priority: string;
  category: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AnalyticsOverview {
  total: number;
  delivered: number;
  failed: number;
  queued: number;
  scheduled: number;
  deliveryRate: string;
  failureRate: string;
  byChannel: Record<NotificationChannel, number>;
  providerStats: {
    name: string;
    channel: string;
    attempts: number;
    successRate: string;
    avgLatencyMs: number;
  }[];
  activeWorkers: number;
}
