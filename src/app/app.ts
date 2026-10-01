import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api } from './services/api';
import { Header } from './components/header';
import { Sidebar, NavTab } from './components/sidebar';
import { Dashboard } from './components/dashboard';
import { NotificationsList } from './components/notifications-list';
import { NotificationDrawer } from './components/notification-drawer';
import { ComposerModal } from './components/composer-modal';
import { TemplatesManager } from './components/templates-manager';
import { ProvidersManager } from './components/providers-manager';
import { PreferencesManager } from './components/preferences-manager';
import { ApiKeysManager } from './components/api-keys-manager';
import { AnalyticsView } from './components/analytics-view';
import { AuditLogsView } from './components/audit-logs-view';
import { QueueMonitor } from './components/queue-monitor';
import { ToastContainer } from './components/toast-container';
import { DeliveryAttempt, NotificationItem, Template } from './models/notifyx';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    Header,
    Sidebar,
    Dashboard,
    NotificationsList,
    NotificationDrawer,
    ComposerModal,
    TemplatesManager,
    ProvidersManager,
    PreferencesManager,
    ApiKeysManager,
    AnalyticsView,
    AuditLogsView,
    QueueMonitor,
    ToastContainer,
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      <!-- Top Application Header -->
      <app-header (openComposer)="openComposerModal()" />

      <!-- Main Layout (Sidebar + Content) -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- Left Sidebar Navigation -->
        <app-sidebar 
          [activeTab]="activeTab()" 
          (tabChange)="onTabChange($event)" />

        <!-- Dynamic Main Content Area -->
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
          @switch (activeTab()) {
            @case ('dashboard') {
              <app-dashboard
                (openComposer)="openComposerModal()"
                (viewAllNotifications)="goToNotifications('ALL')"
                (viewFailed)="goToNotifications('FAILED')"
                (selectNotification)="openNotificationDrawer($event)" />
            }
            @case ('notifications') {
              <app-notifications-list
                [initialTab]="notificationsInitialTab()"
                (openComposer)="openComposerModal()"
                (selectNotification)="openNotificationDrawer($event)" />
            }
            @case ('templates') {
              <app-templates-manager />
            }
            @case ('providers') {
              <app-providers-manager />
            }
            @case ('preferences') {
              <app-preferences-manager />
            }
            @case ('api-keys') {
              <app-api-keys-manager />
            }
            @case ('analytics') {
              <app-analytics-view />
            }
            @case ('queue') {
              <app-queue-monitor />
            }
            @case ('audit-logs') {
              <app-audit-logs-view />
            }
          }
        </main>

      </div>

      <!-- Quick Compose Modal -->
      @if (showComposer()) {
        <app-composer-modal
          [templates]="templates()"
          (close)="showComposer.set(false)"
          (dispatched)="onNotificationDispatched()" />
      }

      <!-- Notification Detail Drawer -->
      @if (selectedNotification()) {
        <app-notification-drawer
          [notification]="selectedNotification()!"
          [attempts]="selectedAttempts()"
          (close)="selectedNotification.set(null)"
          (refreshed)="refreshDrawerDetail()" />
      }

      <!-- Toast Feedback Notifications Container -->
      <app-toast-container />

    </div>
  `
})
export class App {
  private api = inject(Api);

  public activeTab = signal<NavTab>('dashboard');
  public showComposer = signal<boolean>(false);
  public notificationsInitialTab = signal<string>('ALL');

  public selectedNotification = signal<NotificationItem | null>(null);
  public selectedAttempts = signal<DeliveryAttempt[]>([]);
  public templates = signal<Template[]>([]);

  constructor() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.api.getTemplates().subscribe(res => this.templates.set(res.data));
  }

  onTabChange(tab: NavTab) {
    this.activeTab.set(tab);
  }

  goToNotifications(tab: string) {
    this.notificationsInitialTab.set(tab);
    this.activeTab.set('notifications');
  }

  openComposerModal() {
    this.loadTemplates();
    this.showComposer.set(true);
  }

  onNotificationDispatched() {
    this.loadTemplates();
    this.api.refreshInApp();
  }

  openNotificationDrawer(item: NotificationItem) {
    this.selectedNotification.set(item);
    this.api.getNotificationDetail(item.id).subscribe({
      next: (res) => {
        this.selectedNotification.set(res.data);
        this.selectedAttempts.set(res.deliveryAttempts || []);
      }
    });
  }

  refreshDrawerDetail() {
    if (this.selectedNotification()) {
      this.openNotificationDrawer(this.selectedNotification()!);
    }
  }
}
