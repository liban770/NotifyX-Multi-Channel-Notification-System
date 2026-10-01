import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Organization,
  User,
  UserPreference,
  ProviderConfig,
  Template,
  NotificationItem,
  DeliveryAttempt,
  ApiKeyItem,
  AuditLogItem,
  InAppMessage,
  AnalyticsOverview,
  UserRole
} from '../models/notifyx';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1';

  // Reactive state
  public currentUser = signal<User | null>(null);
  public currentOrg = signal<Organization | null>(null);
  public activeRole = signal<UserRole>('ORG_ADMIN');
  public inAppUnreadCount = signal<number>(0);
  public inAppMessages = signal<InAppMessage[]>([]);

  constructor() {
    this.refreshAuthMe();
    this.refreshInApp();
  }

  // 1. Auth & Persona
  refreshAuthMe() {
    this.http.get<{ success: boolean; user: User; organization: Organization }>(`${this.baseUrl}/auth/me`)
      .subscribe({
        next: (res) => {
          this.currentUser.set(res.user);
          this.currentOrg.set(res.organization);
          this.activeRole.set(res.user.role);
        },
        error: (err) => console.error('Auth check error', err)
      });
  }

  switchRole(role: UserRole, orgId?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/switch-role`, { role, orgId }).pipe(
      tap(() => {
        this.activeRole.set(role);
        this.refreshAuthMe();
      })
    );
  }

  // 2. Organizations & Users
  getOrganizations(): Observable<{ success: boolean; data: Organization[]; currentOrgId: string }> {
    return this.http.get<{ success: boolean; data: Organization[]; currentOrgId: string }>(`${this.baseUrl}/organizations`);
  }

  getUsers(): Observable<{ success: boolean; data: User[] }> {
    return this.http.get<{ success: boolean; data: User[] }>(`${this.baseUrl}/users`);
  }

  // 3. Notifications
  getNotifications(filter: {
    status?: string;
    channel?: string;
    priority?: string;
    recipient?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Observable<{
    success: boolean;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    data: NotificationItem[];
  }> {
    let params = new HttpParams();
    if (filter.status && filter.status !== 'ALL') params = params.set('status', filter.status);
    if (filter.channel && filter.channel !== 'ALL') params = params.set('channel', filter.channel);
    if (filter.priority && filter.priority !== 'ALL') params = params.set('priority', filter.priority);
    if (filter.recipient) params = params.set('recipient', filter.recipient);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());

    return this.http.get<any>(`${this.baseUrl}/notifications`, { params });
  }

  getNotificationDetail(id: string): Observable<{
    success: boolean;
    data: NotificationItem;
    deliveryAttempts: DeliveryAttempt[];
  }> {
    return this.http.get<any>(`${this.baseUrl}/notifications/${id}`);
  }

  sendNotification(payload: {
    event?: string;
    recipient: string;
    channels: string[];
    priority?: string;
    data?: Record<string, any>;
    content?: string;
    subject?: string;
    scheduledFor?: string | null;
    idempotencyKey?: string;
    simulateFailure?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/notifications/send`, payload);
  }

  bulkSendNotifications(items: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/notifications/bulk`, { items });
  }

  retryNotification(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/notifications/${id}/retry`, {});
  }

  cancelNotification(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/notifications/${id}/cancel`, {});
  }

  // 4. Templates
  getTemplates(status?: string): Observable<{ success: boolean; data: Template[] }> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<{ success: boolean; data: Template[] }>(`${this.baseUrl}/templates`, { params });
  }

  getTemplate(id: string): Observable<{ success: boolean; data: Template }> {
    return this.http.get<{ success: boolean; data: Template }>(`${this.baseUrl}/templates/${id}`);
  }

  createTemplate(templateData: Partial<Template>): Observable<any> {
    return this.http.post(`${this.baseUrl}/templates`, templateData);
  }

  updateTemplate(id: string, templateData: Partial<Template>): Observable<any> {
    return this.http.put(`${this.baseUrl}/templates/${id}`, templateData);
  }

  deleteTemplate(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/templates/${id}`);
  }

  renderTemplatePreview(id: string, variables: Record<string, string>): Observable<{
    success: boolean;
    rendered: {
      subject: string;
      body: string;
      variants: { SMS: string; PUSH: string; IN_APP: string };
    };
  }> {
    return this.http.post<any>(`${this.baseUrl}/templates/${id}/render-preview`, { variables });
  }

  // 5. Providers
  getProviders(): Observable<{ success: boolean; data: ProviderConfig[] }> {
    return this.http.get<{ success: boolean; data: ProviderConfig[] }>(`${this.baseUrl}/providers`);
  }

  testProvider(providerId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/providers/test-connection`, { providerId });
  }

  updateProvider(id: string, data: Partial<ProviderConfig>): Observable<any> {
    return this.http.put(`${this.baseUrl}/providers/${id}`, data);
  }

  // 6. User Preferences
  getPreferences(email?: string): Observable<{ success: boolean; data: UserPreference }> {
    let params = new HttpParams();
    if (email) params = params.set('email', email);
    return this.http.get<{ success: boolean; data: UserPreference }>(`${this.baseUrl}/preferences`, { params });
  }

  updatePreferences(pref: Partial<UserPreference> & { email?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/preferences`, pref);
  }

  // 7. API Keys
  getApiKeys(): Observable<{ success: boolean; data: ApiKeyItem[] }> {
    return this.http.get<{ success: boolean; data: ApiKeyItem[] }>(`${this.baseUrl}/api-keys`);
  }

  createApiKey(payload: { name: string; scopes: string[]; rateLimitPerMinute?: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api-keys`, payload);
  }

  revokeApiKey(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api-keys/${id}/revoke`, {});
  }

  // 8. Analytics
  getAnalytics(): Observable<{ success: boolean; metrics: AnalyticsOverview }> {
    return this.http.get<{ success: boolean; metrics: AnalyticsOverview }>(`${this.baseUrl}/analytics/overview`);
  }

  // 9. Queue Status
  getQueueStatus(): Observable<{ success: boolean; queue: any }> {
    return this.http.get<{ success: boolean; queue: any }>(`${this.baseUrl}/queue/status`);
  }

  // 10. Audit Logs
  getAuditLogs(): Observable<{ success: boolean; data: AuditLogItem[] }> {
    return this.http.get<{ success: boolean; data: AuditLogItem[] }>(`${this.baseUrl}/audit-logs`);
  }

  // 11. In-App Notifications
  refreshInApp() {
    this.http.get<{ success: boolean; unreadCount: number; messages: InAppMessage[] }>(`${this.baseUrl}/in-app`)
      .subscribe({
        next: (res) => {
          this.inAppUnreadCount.set(res.unreadCount);
          this.inAppMessages.set(res.messages);
        },
        error: (err) => console.error('In-app refresh error', err)
      });
  }

  markInAppRead(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/in-app/mark-read`, { id }).pipe(
      tap(() => this.refreshInApp())
    );
  }
}
