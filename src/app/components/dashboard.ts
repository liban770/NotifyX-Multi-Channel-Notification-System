import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { AnalyticsOverview, NotificationItem, ProviderConfig } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  imports: [MatIconModule, DatePipe],
  template: `
    <div class="space-y-6">
      
      <!-- Top Banner / Title -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Notification Operations Control Center</span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Production Mesh
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Real-time multi-channel delivery throughput, provider telemetry, and queue metrics.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="simulateTraffic()"
            [disabled]="isSimulating()"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer">
            <mat-icon class="text-sm text-indigo-400">speed</mat-icon>
            <span>{{ isSimulating() ? 'Generating Load...' : 'Simulate Traffic' }}</span>
          </button>

          <button
            type="button"
            (click)="openComposer.emit()"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
            <mat-icon class="text-sm">add</mat-icon>
            <span>New Dispatch</span>
          </button>
        </div>
      </div>

      <!-- Core Metrics 4-Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Dispatched -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Total Notifications</span>
            <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <mat-icon class="text-lg">send</mat-icon>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-white font-mono">{{ analytics()?.total || 0 }}</span>
            <div class="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
              <mat-icon class="text-xs">trending_up</mat-icon>
              <span>+18.4% this week</span>
            </div>
          </div>
        </div>

        <!-- Delivery Success Rate -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Delivery Success Rate</span>
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <mat-icon class="text-lg">verified</mat-icon>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-white font-mono">{{ analytics()?.deliveryRate || '98.5%' }}</span>
            <div class="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span>{{ analytics()?.delivered || 0 }} delivered / {{ analytics()?.failed || 0 }} failed</span>
            </div>
          </div>
        </div>

        <!-- Active Queue Backlog -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Redis Queue Depth</span>
            <div class="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <mat-icon class="text-lg">layers</mat-icon>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-sky-400 font-mono">{{ queueDepth() }}</span>
            <div class="mt-1 flex items-center gap-1.5 text-[11px] text-sky-300 font-mono">
              <span>4 Celery Workers Active</span>
            </div>
          </div>
        </div>

        <!-- Dead-Letter & Failures -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Dead-Letter / Failed</span>
            <div class="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <mat-icon class="text-lg">error_outline</mat-icon>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-rose-400 font-mono">{{ analytics()?.failed || 0 }}</span>
            <div class="mt-1 flex items-center gap-1 text-[11px] text-rose-300 font-mono">
              <span class="hover:underline cursor-pointer" (click)="viewFailed.emit()">Inspect Failure Logs</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Mid Section: Channel Distribution & Provider Latency Matrix -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Channels Breakdown -->
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
              <mat-icon class="text-sm text-indigo-400">hub</mat-icon> Channels Distribution
            </h3>
            <span class="text-[11px] font-mono text-slate-500">4 Active</span>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300 flex items-center gap-1.5">
                  <mat-icon class="text-xs text-indigo-400">email</mat-icon> Email (SendGrid / SES)
                </span>
                <span class="font-mono text-slate-400">{{ analytics()?.byChannel?.EMAIL || 12 }} msgs</span>
              </div>
              <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 rounded-full" style="width: 48%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300 flex items-center gap-1.5">
                  <mat-icon class="text-xs text-emerald-400">sms</mat-icon> SMS (Twilio Global)
                </span>
                <span class="font-mono text-slate-400">{{ analytics()?.byChannel?.SMS || 6 }} msgs</span>
              </div>
              <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" style="width: 25%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300 flex items-center gap-1.5">
                  <mat-icon class="text-xs text-amber-400">notifications_active</mat-icon> Push (Firebase FCM)
                </span>
                <span class="font-mono text-slate-400">{{ analytics()?.byChannel?.PUSH || 4 }} msgs</span>
              </div>
              <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full" style="width: 18%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300 flex items-center gap-1.5">
                  <mat-icon class="text-xs text-sky-400">inbox</mat-icon> In-App Engine (WebSocket)
                </span>
                <span class="font-mono text-slate-400">{{ analytics()?.byChannel?.IN_APP || 8 }} msgs</span>
              </div>
              <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-sky-500 rounded-full" style="width: 32%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Provider Health & Failover Matrix -->
        <div class="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
              <mat-icon class="text-sm text-indigo-400">electrical_services</mat-icon> Provider Health & Circuit Breakers
            </h3>
            <span class="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              All Adapters Normal
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-500">
                  <th class="pb-2">Gateway Provider</th>
                  <th class="pb-2">Channel</th>
                  <th class="pb-2">Priority</th>
                  <th class="pb-2">Ping Latency</th>
                  <th class="pb-2">Health</th>
                  <th class="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                @for (p of providers(); track p.id) {
                  <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="py-2.5 font-sans font-medium text-slate-200 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full" [class]="p.healthStatus === 'HEALTHY' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                      {{ p.name }}
                    </td>
                    <td class="py-2.5 text-slate-400">{{ p.channel }}</td>
                    <td class="py-2.5 text-slate-400">Tier {{ p.priority }}</td>
                    <td class="py-2.5 text-slate-300">{{ p.lastPingMs }}ms</td>
                    <td class="py-2.5">
                      <span class="px-1.5 py-0.5 rounded text-[10px]"
                        [class]="p.healthStatus === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'">
                        {{ p.healthStatus }}
                      </span>
                    </td>
                    <td class="py-2.5 text-right">
                      <button 
                        type="button" 
                        (click)="pingProvider(p.id)"
                        class="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer">
                        Ping
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Recent Notifications Stream -->
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
            <mat-icon class="text-sm text-indigo-400">history</mat-icon> Live Dispatched Stream
          </h3>
          <button
            type="button"
            (click)="viewAllNotifications.emit()"
            class="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer">
            View All Notifications →
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-500">
                <th class="pb-2.5">ID / Event</th>
                <th class="pb-2.5">Recipient</th>
                <th class="pb-2.5">Channel</th>
                <th class="pb-2.5">Status</th>
                <th class="pb-2.5">Priority</th>
                <th class="pb-2.5">Timestamp</th>
                <th class="pb-2.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (n of recentNotifications(); track n.id) {
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="py-3">
                    <p class="font-mono text-xs font-medium text-slate-200">{{ n.id }}</p>
                    <p class="text-[11px] text-slate-500 font-mono">{{ n.notificationType }}</p>
                  </td>
                  <td class="py-3 font-mono text-xs text-slate-300">{{ n.recipient }}</td>
                  <td class="py-3">
                    <span class="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300">
                      <mat-icon class="text-xs text-indigo-400">{{ getChannelIcon(n.channel) }}</mat-icon>
                      {{ n.channel }}
                    </span>
                  </td>
                  <td class="py-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border"
                      [class]="getStatusClasses(n.status)">
                      {{ n.status }}
                    </span>
                  </td>
                  <td class="py-3">
                    <span class="text-[11px] font-mono" [class]="n.priority === 'CRITICAL' ? 'text-rose-400 font-bold' : 'text-slate-400'">
                      {{ n.priority }}
                    </span>
                  </td>
                  <td class="py-3 font-mono text-[11px] text-slate-400">
                    {{ n.createdAt | date:'shortTime' }}
                  </td>
                  <td class="py-3 text-right">
                    <button
                      type="button"
                      (click)="selectNotification.emit(n)"
                      class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer">
                      <mat-icon class="text-base">open_in_new</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class Dashboard {
  private api = inject(Api);
  private toast = inject(Toast);

  public openComposer = output<void>();
  public viewAllNotifications = output<void>();
  public viewFailed = output<void>();
  public selectNotification = output<NotificationItem>();

  public analytics = signal<AnalyticsOverview | null>(null);
  public providers = signal<ProviderConfig[]>([]);
  public recentNotifications = signal<NotificationItem[]>([]);
  public queueDepth = signal<number>(0);
  public isSimulating = signal<boolean>(false);

  constructor() {
    this.loadData();
  }

  loadData() {
    this.api.getAnalytics().subscribe(res => this.analytics.set(res.metrics));
    this.api.getProviders().subscribe(res => this.providers.set(res.data));
    this.api.getNotifications({ pageSize: 6 }).subscribe(res => {
      this.recentNotifications.set(res.data);
    });
    this.api.getQueueStatus().subscribe(res => {
      this.queueDepth.set(res.queue?.currentPendingNotifs || 0);
    });
  }

  pingProvider(id: string) {
    this.api.testProvider(id).subscribe({
      next: (res) => {
        this.toast.success('Gateway Tested', `${res.message} Latency: ${res.latencyMs}ms`);
        this.loadData();
      },
      error: (err) => this.toast.error('Ping Failed', err.message)
    });
  }

  simulateTraffic() {
    this.isSimulating.set(true);
    const mockBatch = [
      { recipient: 'user.alpha@acme.com', channel: 'EMAIL', event: 'security.otp', subject: 'Your Code', content: 'Code: 98124' },
      { recipient: '+252615000111', channel: 'SMS', event: 'system.maintenance', content: 'Maintenance at 02:00' },
      { recipient: 'user.beta@acme.com', channel: 'IN_APP', event: 'account.created', title: 'Welcome', content: 'Account ready' },
    ];

    this.api.bulkSendNotifications(mockBatch).subscribe({
      next: (res) => {
        this.isSimulating.set(false);
        this.toast.success('Load Dispatched', `Enqueued ${res.enqueuedCount} notifications on Celery queue.`);
        this.loadData();
      },
      error: (err) => {
        this.isSimulating.set(false);
        this.toast.error('Simulation Failed', err.message);
      }
    });
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'QUEUED':
      case 'PROCESSING': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'FAILED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'SCHEDULED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  getChannelIcon(channel: string): string {
    switch (channel) {
      case 'EMAIL': return 'email';
      case 'SMS': return 'sms';
      case 'PUSH': return 'notifications_active';
      case 'IN_APP': return 'inbox';
      default: return 'send';
    }
  }
}
