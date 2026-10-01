import { Router, Request } from 'express';
import crypto from 'node:crypto';

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
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'STAFF_USER' | 'RECIPIENT';
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
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "08:00"
  timezone: string;        // e.g. "Africa/Mogadishu", "UTC", "America/New_York"
  preferredLanguage: string;
}

export interface ProviderConfig {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  providerType: 'SENDGRID' | 'AWS_SES' | 'SMTP' | 'TWILIO' | 'AWS_SNS' | 'FCM' | 'IN_APP_CORE';
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
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'MULTI_CHANNEL';
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
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject: string;
  content: string;
  metadata: Record<string, any>;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED' | 'SCHEDULED';
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

// ----------------------------------------------------
// In-Memory Database & Seed Data
// ----------------------------------------------------
class NotifyXDatabase {
  public organizations: Organization[] = [
    {
      id: 'org_acme_corp',
      name: 'Acme Global FinTech',
      slug: 'acme-fintech',
      plan: 'Enterprise Tier',
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    },
    {
      id: 'org_nexus_health',
      name: 'Nexus Health Systems',
      slug: 'nexus-health',
      plan: 'Healthcare Compliant',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    }
  ];

  public currentOrgId = 'org_acme_corp';
  public currentUserRole: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'STAFF_USER' | 'RECIPIENT' = 'ORG_ADMIN';

  public users: User[] = [
    {
      id: 'usr_ahmed',
      organizationId: 'org_acme_corp',
      email: 'ahmedlibanmohamed89@gmail.com',
      firstName: 'Ahmed',
      lastName: 'Mohamed',
      role: 'ORG_ADMIN',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: 'usr_admin',
      organizationId: 'org_acme_corp',
      email: 'superadmin@notifyx.io',
      firstName: 'Sarah',
      lastName: 'Vance',
      role: 'SUPER_ADMIN',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
    },
    {
      id: 'usr_staff',
      organizationId: 'org_acme_corp',
      email: 'dispatcher@acme.com',
      firstName: 'Tariq',
      lastName: 'Farah',
      role: 'STAFF_USER',
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    }
  ];

  public preferences: Record<string, UserPreference> = {
    'ahmedlibanmohamed89@gmail.com': {
      userId: 'usr_ahmed',
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      marketingOptIn: false,
      securityAlertsOptIn: true,
      transactionalOptIn: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:30',
      timezone: 'Africa/Mogadishu',
      preferredLanguage: 'en',
    },
    'default@notifyx.io': {
      userId: 'default',
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      marketingOptIn: true,
      securityAlertsOptIn: true,
      transactionalOptIn: true,
      quietHoursEnabled: false,
      quietHoursStart: '23:00',
      quietHoursEnd: '06:00',
      timezone: 'UTC',
      preferredLanguage: 'en',
    }
  };

  public providers: ProviderConfig[] = [
    {
      id: 'prov_sendgrid',
      channel: 'EMAIL',
      providerType: 'SENDGRID',
      name: 'SendGrid Production Gateway',
      isActive: true,
      isDefault: true,
      priority: 1,
      healthStatus: 'HEALTHY',
      lastPingMs: 68,
      settings: { senderEmail: 'no-reply@notifyx.io', apiHost: 'api.sendgrid.com/v3' }
    },
    {
      id: 'prov_ses',
      channel: 'EMAIL',
      providerType: 'AWS_SES',
      name: 'Amazon Simple Email Service (SES)',
      isActive: true,
      isDefault: false,
      priority: 2,
      healthStatus: 'HEALTHY',
      lastPingMs: 112,
      settings: { region: 'us-east-1', sourceArn: 'arn:aws:ses:us-east-1:123456789:identity' }
    },
    {
      id: 'prov_twilio',
      channel: 'SMS',
      providerType: 'TWILIO',
      name: 'Twilio Programmable SMS API',
      isActive: true,
      isDefault: true,
      priority: 1,
      healthStatus: 'HEALTHY',
      lastPingMs: 84,
      settings: { senderId: 'NOTIFYX', accountSidPrefix: 'AC781b0...' }
    },
    {
      id: 'prov_fcm',
      channel: 'PUSH',
      providerType: 'FCM',
      name: 'Firebase Cloud Messaging v1',
      isActive: true,
      isDefault: true,
      priority: 1,
      healthStatus: 'HEALTHY',
      lastPingMs: 76,
      settings: { projectId: 'notifyx-push-mesh', serviceAccountKey: 'configured' }
    },
    {
      id: 'prov_inapp',
      channel: 'IN_APP',
      providerType: 'IN_APP_CORE',
      name: 'NotifyX Real-Time In-App Engine',
      isActive: true,
      isDefault: true,
      priority: 1,
      healthStatus: 'HEALTHY',
      lastPingMs: 14,
      settings: { websocketEnabled: true, persistentDays: 30 }
    }
  ];

  public templates: Template[] = [
    {
      id: 'tpl_account_created',
      organizationId: 'org_acme_corp',
      notificationType: 'account.created',
      name: 'Account Onboarding Confirmation',
      channel: 'MULTI_CHANNEL',
      subjectTemplate: 'Welcome to NotifyX, {{user_name}}!',
      bodyTemplate: 'Hello {{user_name}},\n\nYour enterprise account for {{account_name}} has been successfully provisioned. You can now configure notification channels, connect providers, and generate API credentials.\n\nBest regards,\nThe NotifyX Infrastructure Team',
      channelVariants: {
        SMS: 'NotifyX: Hello {{user_name}}, your {{account_name}} account is verified & ready.',
        PUSH: 'Welcome {{user_name}}! Your {{account_name}} account is now active.',
        IN_APP: 'Welcome aboard {{user_name}}. Your workspace for {{account_name}} is ready.'
      },
      requiredVariables: ['user_name', 'account_name'],
      version: 2,
      status: 'ACTIVE',
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'tpl_security_otp',
      organizationId: 'org_acme_corp',
      notificationType: 'security.otp',
      name: 'Two-Factor Authentication Code',
      channel: 'MULTI_CHANNEL',
      subjectTemplate: 'Security Verification Code: {{otp_code}}',
      bodyTemplate: 'Security Alert:\n\nYour one-time authorization code is {{otp_code}}. It expires in {{expiry_minutes}} minutes. If you did not request this, secure your account immediately.',
      channelVariants: {
        SMS: 'Your NotifyX security code is {{otp_code}}. Valid for {{expiry_minutes}} mins. Do not share.',
        PUSH: 'Security Code: {{otp_code}} (Expires in {{expiry_minutes}}m)',
        IN_APP: 'Security code requested: {{otp_code}} (valid {{expiry_minutes}}m)'
      },
      requiredVariables: ['otp_code', 'expiry_minutes'],
      version: 3,
      status: 'ACTIVE',
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'tpl_payment_reminder',
      organizationId: 'org_acme_corp',
      notificationType: 'billing.payment_reminder',
      name: 'Invoice Payment Due Reminder',
      channel: 'EMAIL',
      subjectTemplate: 'Reminder: Invoice {{invoice_id}} due on {{due_date}}',
      bodyTemplate: 'Hi {{user_name}},\n\nThis is a friendly reminder that invoice {{invoice_id}} for the amount of {{amount}} is scheduled for automatic settlement on {{due_date}}.\n\nReview payment methods in your billing settings.',
      channelVariants: {
        IN_APP: 'Invoice {{invoice_id}} for {{amount}} is due on {{due_date}}.'
      },
      requiredVariables: ['user_name', 'invoice_id', 'amount', 'due_date'],
      version: 1,
      status: 'ACTIVE',
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'tpl_maintenance_alert',
      organizationId: 'org_acme_corp',
      notificationType: 'system.maintenance',
      name: 'Scheduled Maintenance Notice',
      channel: 'MULTI_CHANNEL',
      subjectTemplate: 'Maintenance Window Notice: {{maintenance_window}}',
      bodyTemplate: 'Scheduled Platform Maintenance Notice:\n\nWe will be upgrading core database clusters during {{maintenance_window}}. Services may experience momentary latency of under 30 seconds.',
      channelVariants: {
        SMS: 'NotifyX Notice: Maintenance scheduled for {{maintenance_window}}.',
        PUSH: 'Maintenance scheduled: {{maintenance_window}}',
        IN_APP: 'Platform maintenance scheduled for {{maintenance_window}}.'
      },
      requiredVariables: ['maintenance_window'],
      version: 1,
      status: 'ACTIVE',
      updatedAt: new Date(Date.now() - 12 * 86400000).toISOString()
    }
  ];

  public notifications: NotificationItem[] = [];
  public deliveryAttempts: DeliveryAttempt[] = [];

  public apiKeys: ApiKeyItem[] = [
    {
      id: 'key_prod_finance',
      clientId: 'client_fintech_svc',
      name: 'FinTech Ingestion Pipeline Key',
      keyPrefix: 'nx_live_fin98',
      keyHash: crypto.createHash('sha256').update('nx_live_fin98_entropy98234827').digest('hex'),
      maskedSecret: 'nx_live_fin98••••••••••••••••3a9f',
      scopes: ['notifications.send', 'notifications.read', 'templates.read'],
      rateLimitPerMinute: 2500,
      lastUsedAt: new Date(Date.now() - 120000).toISOString(),
      isRevoked: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'key_qa_staging',
      clientId: 'client_qa_cluster',
      name: 'Automated CI/CD Integration Key',
      keyPrefix: 'nx_test_qa12',
      keyHash: crypto.createHash('sha256').update('nx_test_qa12_staging881923').digest('hex'),
      maskedSecret: 'nx_test_qa12••••••••••••••••7c41',
      scopes: ['notifications.send', 'templates.read'],
      rateLimitPerMinute: 500,
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      isRevoked: false,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    }
  ];

  public auditLogs: AuditLogItem[] = [];
  public inAppMessages: InAppMessage[] = [];

  // Celery queue simulation stats
  public queueStats = {
    activeWorkers: 4,
    redisStatus: 'CONNECTED (Redis 7.2-alpine)',
    totalQueued: 0,
    totalProcessing: 0,
    totalCompleted: 0,
    totalFailed: 0,
    concurrency: 8,
    workerPings: ['worker-1 (high_priority)', 'worker-2 (default)', 'worker-3 (default)', 'worker-4 (bulk)']
  };

  constructor() {
    this.seedInitialNotifications();
    this.startWorkerSimulation();
  }

  private seedInitialNotifications() {
    const recipients = [
      'ahmedlibanmohamed89@gmail.com',
      'dev.lead@acmepay.com',
      '+252615891234',
      'device_token_fcm_ios_98214',
      'sec.ops@acme.com',
      '+14155552671'
    ];

    const types = ['account.created', 'security.otp', 'billing.payment_reminder', 'system.maintenance'];
    const channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[] = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];

    // Generate historical notifications with realistic delivery attempts
    for (let i = 1; i <= 24; i++) {
      const channel = channels[i % channels.length];
      const nType = types[i % types.length];
      const isFailed = i === 7 || i === 19;
      const isScheduled = i === 23;
      const isProcessing = i === 24;
      const id = `notif_${1000 + i}`;
      const recipient = recipients[i % recipients.length];
      const timestamp = new Date(Date.now() - (25 - i) * 3600000).toISOString();

      const status: 'DELIVERED' | 'FAILED' | 'SCHEDULED' | 'PROCESSING' = isFailed
        ? 'FAILED'
        : isScheduled
        ? 'SCHEDULED'
        : isProcessing
        ? 'PROCESSING'
        : 'DELIVERED';

      const notif: NotificationItem = {
        id,
        organizationId: 'org_acme_corp',
        recipient,
        notificationType: nType,
        channel,
        subject: channel === 'EMAIL' ? `Notification Notice #${1000 + i}: ${nType}` : `Alert #${1000 + i}`,
        content: `Production transactional message payload for ${recipient} via ${channel}. Event: ${nType}`,
        metadata: { source: 'api_v1_send', batchId: `batch_${Math.floor(i / 5)}`, priorityLevel: i % 2 === 0 ? 'HIGH' : 'NORMAL' },
        priority: i % 4 === 0 ? 'CRITICAL' : i % 2 === 0 ? 'HIGH' : 'NORMAL',
        status: status as any,
        scheduledFor: isScheduled ? new Date(Date.now() + 4 * 3600000).toISOString() : null,
        sentAt: (!isScheduled && !isProcessing) ? timestamp : null,
        deliveredAt: status === 'DELIVERED' ? timestamp : null,
        failedAt: status === 'FAILED' ? timestamp : null,
        retryCount: isFailed ? 3 : 1,
        maxRetries: 3,
        errorMessage: isFailed ? (channel === 'SMS' ? 'Twilio Error 30008: Unknown destination carrier error' : 'SendGrid Error 429: Rate limit exceeded') : null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      this.notifications.push(notif);

      // Create delivery attempt records
      if (status === 'DELIVERED' || status === 'FAILED') {
        const provName = channel === 'EMAIL' ? 'SendGrid' : channel === 'SMS' ? 'Twilio' : channel === 'PUSH' ? 'FCM' : 'NotifyX In-App';
        const attempt1: DeliveryAttempt = {
          id: `att_${id}_1`,
          notificationId: id,
          attemptNumber: 1,
          channel,
          providerName: provName,
          status: isFailed ? 'FAILED' : 'SUCCESS',
          httpStatusCode: isFailed ? (channel === 'SMS' ? 400 : 503) : 202,
          providerMessageId: isFailed ? undefined : `prov_${channel.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}`,
          rawResponse: isFailed
            ? { error: notif.errorMessage, code: 30008, carrier: 'Carrier_Lookup_Failed' }
            : { status: 'queued_accepted', message_id: `msg_${i}`, timestamp },
          errorDetails: isFailed ? notif.errorMessage! : undefined,
          executionTimeMs: Math.floor(Math.random() * 80) + 45,
          createdAt: timestamp
        };
        this.deliveryAttempts.push(attempt1);

        if (isFailed) {
          // Second attempt
          this.deliveryAttempts.push({
            id: `att_${id}_2`,
            notificationId: id,
            attemptNumber: 2,
            channel,
            providerName: channel === 'EMAIL' ? 'Amazon SES (Fallback)' : 'Twilio Backup Route',
            status: 'FAILED',
            httpStatusCode: 504,
            rawResponse: { error: 'Gateway Timeout during fallback retry' },
            errorDetails: 'Fallback provider returned 504 Gateway Timeout',
            executionTimeMs: 1200,
            createdAt: new Date(Date.now() - (25 - i) * 3600000 + 15000).toISOString()
          });
        }
      }
    }

    // Pre-seed some in-app notifications for Ahmed
    this.inAppMessages = [
      {
        id: 'inapp_1',
        recipientEmail: 'ahmedlibanmohamed89@gmail.com',
        title: 'API Client Key Rotated',
        message: 'FinTech Ingestion Pipeline Key was successfully rotated by security protocol.',
        priority: 'NORMAL',
        category: 'SECURITY',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        actionUrl: '/api-keys'
      },
      {
        id: 'inapp_2',
        recipientEmail: 'ahmedlibanmohamed89@gmail.com',
        title: 'New Template Published',
        message: 'Template "Security Verification Code" has been bumped to Version 3.',
        priority: 'LOW',
        category: 'TEMPLATES',
        isRead: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        actionUrl: '/templates'
      },
      {
        id: 'inapp_3',
        recipientEmail: 'ahmedlibanmohamed89@gmail.com',
        title: 'High Throughput Dispatched',
        message: 'Batch #42 delivered 120 notifications across Email & SMS channels.',
        priority: 'NORMAL',
        category: 'SYSTEM',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        actionUrl: '/notifications'
      }
    ];

    // Seed audit logs
    this.auditLogs = [
      {
        id: 'audit_101',
        organizationId: 'org_acme_corp',
        actorEmail: 'ahmedlibanmohamed89@gmail.com',
        actorRole: 'ORG_ADMIN',
        action: 'notification.dispatched',
        resourceType: 'Notification',
        resourceId: 'notif_1024',
        ipAddress: '197.234.221.14',
        metadata: { channels: ['EMAIL', 'PUSH'], recipientCount: 1 },
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 'audit_102',
        organizationId: 'org_acme_corp',
        actorEmail: 'ahmedlibanmohamed89@gmail.com',
        actorRole: 'ORG_ADMIN',
        action: 'template.updated',
        resourceType: 'Template',
        resourceId: 'tpl_security_otp',
        ipAddress: '197.234.221.14',
        metadata: { version: 3, fieldsChanged: ['channelVariants.SMS'] },
        timestamp: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'audit_103',
        organizationId: 'org_acme_corp',
        actorEmail: 'superadmin@notifyx.io',
        actorRole: 'SUPER_ADMIN',
        action: 'provider.priority_changed',
        resourceType: 'ProviderConfig',
        resourceId: 'prov_sendgrid',
        ipAddress: '54.210.12.89',
        metadata: { newPriority: 1, fallbackProvider: 'prov_ses' },
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  /**
   * Internal Celery Worker Simulator:
   * Periodically checks QUEUED items and advances them to PROCESSING -> DELIVERED / FAILED,
   * creating realistic DeliveryAttempts.
   */
  private startWorkerSimulation() {
    setInterval(() => {
      // Find QUEUED or PROCESSING notifications
      const queuedItem = this.notifications.find(n => n.status === 'QUEUED');
      if (queuedItem) {
        queuedItem.status = 'PROCESSING';
        this.queueStats.totalProcessing++;
        if (this.queueStats.totalQueued > 0) this.queueStats.totalQueued--;

        setTimeout(() => {
          const isSimulatedFail = queuedItem.metadata?.['simulateFailure'] === true;
          const provName = queuedItem.channel === 'EMAIL' ? 'SendGrid' : queuedItem.channel === 'SMS' ? 'Twilio' : queuedItem.channel === 'PUSH' ? 'FCM' : 'In-App Hub';
          const attemptNum = queuedItem.retryCount + 1;

          if (isSimulatedFail) {
            queuedItem.retryCount = attemptNum;
            queuedItem.errorMessage = `Simulated provider outage: ${provName} connection refused`;
            if (attemptNum < queuedItem.maxRetries) {
              queuedItem.status = 'QUEUED';
              this.queueStats.totalQueued++;
            } else {
              queuedItem.status = 'FAILED';
              queuedItem.failedAt = new Date().toISOString();
              this.queueStats.totalFailed++;
            }

            this.deliveryAttempts.unshift({
              id: `att_${queuedItem.id}_${attemptNum}`,
              notificationId: queuedItem.id,
              attemptNumber: attemptNum,
              channel: queuedItem.channel,
              providerName: provName,
              status: 'FAILED',
              httpStatusCode: 500,
              rawResponse: { error: queuedItem.errorMessage },
              errorDetails: queuedItem.errorMessage,
              executionTimeMs: 140,
              createdAt: new Date().toISOString()
            });
          } else {
            queuedItem.status = 'DELIVERED';
            queuedItem.sentAt = new Date().toISOString();
            queuedItem.deliveredAt = new Date().toISOString();
            queuedItem.errorMessage = null;
            this.queueStats.totalCompleted++;

            this.deliveryAttempts.unshift({
              id: `att_${queuedItem.id}_${attemptNum}`,
              notificationId: queuedItem.id,
              attemptNumber: attemptNum,
              channel: queuedItem.channel,
              providerName: provName,
              status: 'SUCCESS',
              httpStatusCode: 200,
              providerMessageId: `live_msg_${Math.random().toString(36).substring(2, 9)}`,
              rawResponse: { status: 'delivered', recipient: queuedItem.recipient },
              executionTimeMs: Math.floor(Math.random() * 50) + 30,
              createdAt: new Date().toISOString()
            });

            // If channel is IN_APP, add to recipient in-app center
            if (queuedItem.channel === 'IN_APP') {
              this.inAppMessages.unshift({
                id: `inapp_live_${Date.now()}`,
                recipientEmail: queuedItem.recipient,
                title: queuedItem.subject,
                message: queuedItem.content,
                priority: queuedItem.priority,
                category: queuedItem.notificationType,
                isRead: false,
                createdAt: new Date().toISOString()
              });
            }
          }
          if (this.queueStats.totalProcessing > 0) this.queueStats.totalProcessing--;
        }, 1200);
      }
    }, 1500);
  }

  public recordAudit(actorEmail: string, role: string, action: string, resourceType: string, resourceId: string, metadata: any = {}) {
    this.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      organizationId: this.currentOrgId,
      actorEmail,
      actorRole: role,
      action,
      resourceType,
      resourceId,
      ipAddress: '127.0.0.1 (Internal Gateway)',
      metadata,
      timestamp: new Date().toISOString()
    });
  }
}

export const db = new NotifyXDatabase();

// ----------------------------------------------------
// REST API Router
// ----------------------------------------------------
export function createApiRouter(): Router {
  const router = Router();

  // Helper: current user context
  const getActor = (_req?: Request) => {
    return {
      email: 'ahmedlibanmohamed89@gmail.com',
      role: db.currentUserRole,
      orgId: db.currentOrgId,
    };
  };

  // 1. Auth & Persona switching
  router.get('/auth/me', (req, res) => {
    const actor = getActor(req);
    const user = db.users.find(u => u.email === actor.email) || db.users[0];
    const org = db.organizations.find(o => o.id === user.organizationId) || db.organizations[0];

    res.json({
      success: true,
      user: {
        ...user,
        role: db.currentUserRole, // reflects current active role
      },
      organization: org,
      availableRoles: ['SUPER_ADMIN', 'ORG_ADMIN', 'STAFF_USER', 'RECIPIENT']
    });
  });

  router.post('/auth/switch-role', (req, res) => {
    const { role, orgId } = req.body;
    if (role && ['SUPER_ADMIN', 'ORG_ADMIN', 'STAFF_USER', 'RECIPIENT'].includes(role)) {
      db.currentUserRole = role;
    }
    if (orgId && db.organizations.some(o => o.id === orgId)) {
      db.currentOrgId = orgId;
    }
    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'auth.switch_role', 'Session', 'session_current', { role: db.currentUserRole, orgId: db.currentOrgId });
    res.json({
      success: true,
      activeRole: db.currentUserRole,
      activeOrgId: db.currentOrgId,
      message: `Active persona switched to ${db.currentUserRole}`
    });
  });

  // 2. Organizations & Users
  router.get('/organizations', (req, res) => {
    res.json({ success: true, data: db.organizations, currentOrgId: db.currentOrgId });
  });

  router.get('/users', (req, res) => {
    res.json({ success: true, data: db.users });
  });

  // 3. User Preferences
  router.get('/preferences', (req, res) => {
    const email = (req.query['email'] as string) || 'ahmedlibanmohamed89@gmail.com';
    const pref = db.preferences[email] || db.preferences['default@notifyx.io'];
    res.json({ success: true, data: pref });
  });

  router.put('/preferences', (req, res) => {
    const email = req.body.email || 'ahmedlibanmohamed89@gmail.com';
    const existing = db.preferences[email] || db.preferences['default@notifyx.io'];
    const updated = {
      ...existing,
      ...req.body,
      userId: existing.userId || 'usr_custom'
    };
    db.preferences[email] = updated;
    db.recordAudit(email, db.currentUserRole, 'preference.updated', 'UserPreference', email, req.body);
    res.json({ success: true, data: updated, message: 'Preferences updated successfully.' });
  });

  // 4. Templates
  router.get('/templates', (req, res) => {
    const status = req.query['status'] as string;
    let list = db.templates;
    if (status) {
      list = list.filter(t => t.status === status);
    }
    res.json({ success: true, data: list });
  });

  router.get('/templates/:id', (req, res) => {
    const tpl = db.templates.find(t => t.id === req.params.id);
    if (!tpl) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      return;
    }
    res.json({ success: true, data: tpl });
    return;
  });

  router.post('/templates', (req, res) => {
    const { name, notificationType, channel, subjectTemplate, bodyTemplate, channelVariants, requiredVariables } = req.body;
    if (!name || !notificationType || !bodyTemplate) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing name, notificationType or bodyTemplate' } });
      return;
    }

    const newTpl: Template = {
      id: `tpl_${Date.now()}`,
      organizationId: db.currentOrgId,
      name,
      notificationType,
      channel: channel || 'MULTI_CHANNEL',
      subjectTemplate: subjectTemplate || '',
      bodyTemplate,
      channelVariants: channelVariants || {},
      requiredVariables: requiredVariables || [],
      version: 1,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString()
    };

    db.templates.unshift(newTpl);
    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'template.created', 'Template', newTpl.id, { name: newTpl.name });
    res.status(201).json({ success: true, data: newTpl });
    return;
  });

  router.put('/templates/:id', (req, res) => {
    const idx = db.templates.findIndex(t => t.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      return;
    }
    const current = db.templates[idx];
    const updated: Template = {
      ...current,
      ...req.body,
      id: current.id,
      version: current.version + 1,
      updatedAt: new Date().toISOString()
    };
    db.templates[idx] = updated;
    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'template.updated', 'Template', updated.id, { version: updated.version });
    res.json({ success: true, data: updated });
    return;
  });

  router.delete('/templates/:id', (req, res) => {
    const idx = db.templates.findIndex(t => t.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      return;
    }
    const [deleted] = db.templates.splice(idx, 1);
    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'template.deleted', 'Template', deleted.id, { name: deleted.name });
    res.json({ success: true, message: 'Template removed' });
    return;
  });

  // Test preview interpolation
  router.post('/templates/:id/render-preview', (req, res) => {
    const tpl = db.templates.find(t => t.id === req.params.id);
    if (!tpl) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      return;
    }
    const variables: Record<string, string> = req.body.variables || {};

    // Validate required variables
    const missing = tpl.requiredVariables.filter(v => !(v in variables));
    if (missing.length > 0) {
      res.status(422).json({
        success: false,
        error: {
          code: 'MISSING_TEMPLATE_VARIABLES',
          message: `Required variables missing: ${missing.join(', ')}`,
          details: { missingVariables: missing }
        }
      });
      return;
    }

    const interpolate = (text: string) => {
      if (!text) return '';
      let result = text;
      for (const [key, val] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(val));
      }
      return result;
    };

    res.json({
      success: true,
      rendered: {
        subject: interpolate(tpl.subjectTemplate),
        body: interpolate(tpl.bodyTemplate),
        variants: {
          SMS: interpolate(tpl.channelVariants.SMS || tpl.bodyTemplate),
          PUSH: interpolate(tpl.channelVariants.PUSH || tpl.bodyTemplate),
          IN_APP: interpolate(tpl.channelVariants.IN_APP || tpl.bodyTemplate),
        }
      }
    });
    return;
  });

  // 5. Providers Management
  router.get('/providers', (req, res) => {
    res.json({ success: true, data: db.providers });
  });

  router.post('/providers/test-connection', (req, res) => {
    const { providerId } = req.body;
    const provider = db.providers.find(p => p.id === providerId);
    if (!provider) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Provider not found' } });
      return;
    }

    // Synthetic ping
    const ping = Math.floor(Math.random() * 40) + 30;
    provider.lastPingMs = ping;
    provider.healthStatus = 'HEALTHY';

    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'provider.tested', 'ProviderConfig', provider.id, { pingMs: ping, status: 'HEALTHY' });

    res.json({
      success: true,
      providerId,
      status: 'HEALTHY',
      latencyMs: ping,
      message: `Connection to ${provider.name} verified successfully.`
    });
    return;
  });

  router.put('/providers/:id', (req, res) => {
    const provider = db.providers.find(p => p.id === req.params.id);
    if (!provider) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Provider not found' } });
      return;
    }
    Object.assign(provider, req.body);
    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'provider.updated', 'ProviderConfig', provider.id, req.body);
    res.json({ success: true, data: provider });
    return;
  });

  // 6. Notifications Ingestion & Dispatch
  router.post('/notifications/send', (req, res) => {
    const { event, recipient, channels, data = {}, priority = 'NORMAL', scheduledFor, idempotencyKey, simulateFailure } = req.body;

    if (!recipient) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Recipient is required.' } });
      return;
    }

    // Channel array resolution
    const requestedChannels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[] = Array.isArray(channels) && channels.length > 0
      ? channels
      : ['EMAIL'];

    // Check Idempotency Key
    if (idempotencyKey) {
      const existing = db.notifications.find(n => n.idempotencyKey === idempotencyKey);
      if (existing) {
        res.status(200).json({
          success: true,
          idempotentReplay: true,
          message: 'Idempotency key matched existing request.',
          notifications: [existing]
        });
        return;
      }
    }

    // Find template if event matches
    const matchedTemplate = db.templates.find(t => t.notificationType === event);

    // Resolve Recipient Preferences (quiet hours, opt-outs)
    const pref = db.preferences[recipient] || db.preferences['default@notifyx.io'];
    const activeChannels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[] = [];

    for (const ch of requestedChannels) {
      if (priority === 'CRITICAL') {
        // Critical alerts bypass opt-outs
        activeChannels.push(ch);
      } else {
        if (ch === 'EMAIL' && pref.emailEnabled) activeChannels.push(ch);
        if (ch === 'SMS' && pref.smsEnabled) activeChannels.push(ch);
        if (ch === 'PUSH' && pref.pushEnabled) activeChannels.push(ch);
        if (ch === 'IN_APP' && pref.inAppEnabled) activeChannels.push(ch);
      }
    }

    if (activeChannels.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'USER_OPTED_OUT',
          message: `Recipient preferences disable all requested channels: ${requestedChannels.join(', ')}`
        }
      });
      return;
    }

    const createdNotifications: NotificationItem[] = [];

    for (const channel of activeChannels) {
      const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Resolve content
      let subject = `Notification: ${event || 'General Update'}`;
      let content = `Notification message for ${recipient}`;

      if (matchedTemplate) {
        let rawSubject = matchedTemplate.subjectTemplate;
        let rawBody = matchedTemplate.bodyTemplate;

        if (channel === 'SMS' && matchedTemplate.channelVariants.SMS) rawBody = matchedTemplate.channelVariants.SMS;
        if (channel === 'PUSH' && matchedTemplate.channelVariants.PUSH) rawBody = matchedTemplate.channelVariants.PUSH;
        if (channel === 'IN_APP' && matchedTemplate.channelVariants.IN_APP) rawBody = matchedTemplate.channelVariants.IN_APP;

        for (const [k, v] of Object.entries(data)) {
          const reg = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g');
          rawSubject = rawSubject.replace(reg, String(v));
          rawBody = rawBody.replace(reg, String(v));
        }
        subject = rawSubject;
        content = rawBody;
      } else if (req.body.content) {
        content = req.body.content;
        subject = req.body.subject || subject;
      }

      const isScheduled = !!scheduledFor && new Date(scheduledFor).getTime() > Date.now();
      const status = isScheduled ? 'SCHEDULED' : 'QUEUED';

      const notif: NotificationItem = {
        id: notifId,
        organizationId: db.currentOrgId,
        recipient,
        notificationType: event || 'custom.notification',
        templateId: matchedTemplate?.id,
        channel,
        subject,
        content,
        metadata: { ...data, simulateFailure: !!simulateFailure },
        priority,
        status: status as any,
        idempotencyKey,
        scheduledFor: isScheduled ? scheduledFor : null,
        sentAt: null,
        deliveredAt: null,
        failedAt: null,
        retryCount: 0,
        maxRetries: 3,
        errorMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.notifications.unshift(notif);
      createdNotifications.push(notif);

      if (status === 'QUEUED') {
        db.queueStats.totalQueued++;
      }
    }

    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'notification.dispatched', 'Notification', createdNotifications.map(n => n.id).join(','), {
      event,
      recipient,
      channelCount: activeChannels.length,
      priority
    });

    res.status(201).json({
      success: true,
      dispatchedCount: createdNotifications.length,
      notifications: createdNotifications,
      message: `Enqueued ${createdNotifications.length} notification job(s) for asynchronous delivery.`
    });
    return;
  });

  // Bulk dispatch
  router.post('/notifications/bulk', (req, res) => {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: { code: 'EMPTY_PAYLOAD', message: 'Items array is required' } });
      return;
    }

    let enqueued = 0;
    for (const item of items) {
      const notif: NotificationItem = {
        id: `notif_bulk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        organizationId: db.currentOrgId,
        recipient: item.recipient,
        notificationType: item.event || 'bulk.campaign',
        channel: item.channel || 'EMAIL',
        subject: item.subject || 'Campaign Notification',
        content: item.content || 'Campaign payload',
        metadata: item.data || {},
        priority: item.priority || 'NORMAL',
        status: 'QUEUED',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.notifications.unshift(notif);
      db.queueStats.totalQueued++;
      enqueued++;
    }

    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'notification.bulk_dispatched', 'NotificationBatch', `bulk_${Date.now()}`, { count: enqueued });

    res.status(201).json({
      success: true,
      enqueuedCount: enqueued,
      message: `Successfully accepted batch of ${enqueued} notifications into Redis queue.`
    });
    return;
  });

  // Notifications listing
  router.get('/notifications', (req, res) => {
    const { status, channel, priority, recipient, search, page = '1', pageSize = '15' } = req.query;

    let items = db.notifications;

    if (status && status !== 'ALL') {
      items = items.filter(n => n.status === status);
    }
    if (channel && channel !== 'ALL') {
      items = items.filter(n => n.channel === channel);
    }
    if (priority && priority !== 'ALL') {
      items = items.filter(n => n.priority === priority);
    }
    if (recipient) {
      items = items.filter(n => n.recipient.toLowerCase().includes((recipient as string).toLowerCase()));
    }
    if (search) {
      const q = (search as string).toLowerCase();
      items = items.filter(n =>
        n.recipient.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.notificationType.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q)
      );
    }

    const p = parseInt(page as string, 10) || 1;
    const size = parseInt(pageSize as string, 10) || 15;
    const start = (p - 1) * size;
    const paginated = items.slice(start, start + size);

    res.json({
      success: true,
      total: items.length,
      page: p,
      pageSize: size,
      totalPages: Math.ceil(items.length / size),
      data: paginated
    });
    return;
  });

  // Notification Detail + Delivery Attempts
  router.get('/notifications/:id', (req, res) => {
    const notif = db.notifications.find(n => n.id === req.params.id);
    if (!notif) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
      return;
    }
    const attempts = db.deliveryAttempts.filter(a => a.notificationId === notif.id);
    res.json({
      success: true,
      data: notif,
      deliveryAttempts: attempts
    });
    return;
  });

  // Manual Retry
  router.post('/notifications/:id/retry', (req, res) => {
    const notif = db.notifications.find(n => n.id === req.params.id);
    if (!notif) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
      return;
    }

    notif.status = 'QUEUED';
    notif.errorMessage = null;
    db.queueStats.totalQueued++;

    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'notification.retried', 'Notification', notif.id, { retryCount: notif.retryCount });

    res.json({
      success: true,
      message: `Notification ${notif.id} re-enqueued for delivery attempt #${notif.retryCount + 1}.`,
      data: notif
    });
    return;
  });

  // Cancel scheduled
  router.post('/notifications/:id/cancel', (req, res) => {
    const notif = db.notifications.find(n => n.id === req.params.id);
    if (!notif) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
      return;
    }
    if (notif.status !== 'SCHEDULED' && notif.status !== 'QUEUED') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only SCHEDULED or QUEUED notifications can be cancelled.' } });
      return;
    }

    notif.status = 'CANCELLED';
    notif.updatedAt = new Date().toISOString();

    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'notification.cancelled', 'Notification', notif.id);

    res.json({
      success: true,
      message: `Notification ${notif.id} was cancelled.`,
      data: notif
    });
    return;
  });

  // 7. API Keys
  router.get('/api-keys', (req, res) => {
    res.json({ success: true, data: db.apiKeys });
  });

  router.post('/api-keys', (req, res) => {
    const { name, scopes = ['notifications.send', 'notifications.read'], rateLimitPerMinute = 1000 } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'API key name is required.' } });
      return;
    }

    const entropy = crypto.randomBytes(16).toString('hex');
    const prefix = `nx_live_${Math.random().toString(36).substring(2, 6)}`;
    const plaintextKey = `${prefix}_${entropy}`;
    const hash = crypto.createHash('sha256').update(plaintextKey).digest('hex');

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      clientId: 'client_external_app',
      name,
      keyPrefix: prefix,
      keyHash: hash,
      maskedSecret: `${prefix}••••••••••••••••${entropy.slice(-4)}`,
      scopes,
      rateLimitPerMinute,
      lastUsedAt: null,
      isRevoked: false,
      createdAt: new Date().toISOString()
    };

    db.apiKeys.unshift(newKey);
    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'api_key.created', 'ApiKey', newKey.id, { name, scopes });

    res.status(201).json({
      success: true,
      data: newKey,
      plaintextSecretKey: plaintextKey,
      warning: 'Store this key safely! It will NOT be shown again in plaintext.'
    });
    return;
  });

  router.post('/api-keys/:id/revoke', (req, res) => {
    const key = db.apiKeys.find(k => k.id === req.params.id);
    if (!key) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } });
      return;
    }
    key.isRevoked = true;
    db.recordAudit('ahmedlibanmohamed89@gmail.com', db.currentUserRole, 'api_key.revoked', 'ApiKey', key.id);
    res.json({ success: true, message: `Key ${key.name} has been revoked.` });
    return;
  });

  // 8. Analytics & Metrics
  router.get('/analytics/overview', (req, res) => {
    const total = db.notifications.length;
    const delivered = db.notifications.filter(n => n.status === 'DELIVERED').length;
    const failed = db.notifications.filter(n => n.status === 'FAILED').length;
    const queued = db.notifications.filter(n => n.status === 'QUEUED' || n.status === 'PROCESSING').length;
    const scheduled = db.notifications.filter(n => n.status === 'SCHEDULED').length;

    const deliveryRate = total > 0 ? ((delivered / (total - queued - scheduled || 1)) * 100).toFixed(1) : '100.0';
    const failureRate = total > 0 ? ((failed / (total - queued - scheduled || 1)) * 100).toFixed(1) : '0.0';

    // Channels breakdown
    const byChannel = {
      EMAIL: db.notifications.filter(n => n.channel === 'EMAIL').length,
      SMS: db.notifications.filter(n => n.channel === 'SMS').length,
      PUSH: db.notifications.filter(n => n.channel === 'PUSH').length,
      IN_APP: db.notifications.filter(n => n.channel === 'IN_APP').length,
    };

    // Providers performance
    const providerStats = [
      { name: 'SendGrid', channel: 'EMAIL', attempts: 18, successRate: '94.4%', avgLatencyMs: 64 },
      { name: 'Amazon SES', channel: 'EMAIL', attempts: 6, successRate: '100.0%', avgLatencyMs: 110 },
      { name: 'Twilio SMS', channel: 'SMS', attempts: 14, successRate: '85.7%', avgLatencyMs: 82 },
      { name: 'Firebase FCM', channel: 'PUSH', attempts: 12, successRate: '91.6%', avgLatencyMs: 75 },
      { name: 'In-App Engine', channel: 'IN_APP', attempts: 16, successRate: '100.0%', avgLatencyMs: 12 },
    ];

    res.json({
      success: true,
      metrics: {
        total,
        delivered,
        failed,
        queued,
        scheduled,
        deliveryRate: `${deliveryRate}%`,
        failureRate: `${failureRate}%`,
        byChannel,
        providerStats,
        activeWorkers: db.queueStats.activeWorkers
      }
    });
  });

  // 9. Queue & Workers Status
  router.get('/queue/status', (req, res) => {
    res.json({
      success: true,
      queue: {
        ...db.queueStats,
        currentPendingNotifs: db.notifications.filter(n => n.status === 'QUEUED').length,
        currentProcessingNotifs: db.notifications.filter(n => n.status === 'PROCESSING').length,
      }
    });
  });

  // 10. Audit Logs
  router.get('/audit-logs', (req, res) => {
    res.json({ success: true, data: db.auditLogs });
  });

  // 11. In-App Notifications Center
  router.get('/in-app', (req, res) => {
    const unreadCount = db.inAppMessages.filter(m => !m.isRead).length;
    res.json({
      success: true,
      unreadCount,
      messages: db.inAppMessages
    });
  });

  router.post('/in-app/mark-read', (req, res) => {
    const { id } = req.body;
    if (id === 'all') {
      db.inAppMessages.forEach(m => m.isRead = true);
    } else {
      const msg = db.inAppMessages.find(m => m.id === id);
      if (msg) msg.isRead = true;
    }
    res.json({ success: true, unreadCount: db.inAppMessages.filter(m => !m.isRead).length });
  });

  return router;
}
