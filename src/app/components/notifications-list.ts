import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { NotificationItem } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notifications-list',
  imports: [MatIconModule, DatePipe, ReactiveFormsModule],
  template: `
    <div class="space-y-5">
      
      <!-- Header & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Notifications Manager</span>
            <span class="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
              {{ totalCount() }} Total
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Audit, track, inspect delivery attempts, and retry transactional notification jobs.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="loadNotifications()"
            class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh List">
            <mat-icon class="text-lg">refresh</mat-icon>
          </button>

          <button
            type="button"
            (click)="openComposer.emit()"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
            <mat-icon class="text-sm">send</mat-icon>
            <span>Dispatch Job</span>
          </button>
        </div>
      </div>

      <!-- Tab Buttons (All, Scheduled, Failed, Delivery Logs) -->
      <div class="flex items-center gap-1 border-b border-slate-800 pb-px text-xs font-medium">
        <button
          type="button"
          (click)="setTab('ALL')"
          class="px-3.5 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5"
          [class]="activeTab() === 'ALL' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5 font-semibold' : 'text-slate-400 hover:text-slate-200'">
          <span>All Notifications</span>
        </button>

        <button
          type="button"
          (click)="setTab('SCHEDULED')"
          class="px-3.5 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5"
          [class]="activeTab() === 'SCHEDULED' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5 font-semibold' : 'text-slate-400 hover:text-slate-200'">
          <mat-icon class="text-xs">schedule</mat-icon>
          <span>Scheduled</span>
        </button>

        <button
          type="button"
          (click)="setTab('FAILED')"
          class="px-3.5 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5"
          [class]="activeTab() === 'FAILED' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/5 font-semibold' : 'text-slate-400 hover:text-slate-200'">
          <mat-icon class="text-xs text-rose-400">error_outline</mat-icon>
          <span>Failed / DLQ</span>
        </button>

        <button
          type="button"
          (click)="setTab('DELIVERED')"
          class="px-3.5 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5"
          [class]="activeTab() === 'DELIVERED' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5 font-semibold' : 'text-slate-400 hover:text-slate-200'">
          <mat-icon class="text-xs text-emerald-400">check_circle</mat-icon>
          <span>Delivered Logs</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        
        <!-- Search query -->
        <div class="sm:col-span-2 relative">
          <input
            type="text"
            [formControl]="searchCtrl"
            placeholder="Search by recipient, event, ID..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
          <mat-icon class="absolute left-2.5 top-2.5 text-base text-slate-500">search</mat-icon>
        </div>

        <!-- Channel Filter -->
        <div>
          <select
            [formControl]="channelCtrl"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
            <option value="ALL">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="PUSH">Push</option>
            <option value="IN_APP">In-App</option>
          </select>
        </div>

        <!-- Priority Filter -->
        <div>
          <select
            [formControl]="priorityCtrl"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

      </div>

      <!-- Data Table -->
      <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono uppercase text-slate-500">
                <th class="p-3.5">Notification ID / Event</th>
                <th class="p-3.5">Recipient</th>
                <th class="p-3.5">Channel</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5">Retries</th>
                <th class="p-3.5">Created At</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @if (notifications().length === 0) {
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-500 text-xs">
                    No notifications match your current filter criteria.
                  </td>
                </tr>
              }

              @for (n of notifications(); track n.id) {
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="p-3.5">
                    <p class="font-mono text-xs font-semibold text-slate-200">{{ n.id }}</p>
                    <p class="text-[11px] text-slate-500 font-mono">{{ n.notificationType }}</p>
                  </td>
                  
                  <td class="p-3.5 font-mono text-xs text-slate-300">
                    <span class="max-w-[180px] truncate block" title="{{ n.recipient }}">{{ n.recipient }}</span>
                  </td>

                  <td class="p-3.5">
                    <span class="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300">
                      <mat-icon class="text-xs text-indigo-400">{{ getChannelIcon(n.channel) }}</mat-icon>
                      {{ n.channel }}
                    </span>
                  </td>

                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border"
                      [class]="getStatusClasses(n.status)">
                      {{ n.status }}
                    </span>
                  </td>

                  <td class="p-3.5 font-mono text-[11px] text-slate-400">
                    <span>{{ n.retryCount }} / {{ n.maxRetries }}</span>
                    @if (n.status === 'FAILED') {
                      <span class="text-rose-400 text-[10px] ml-1">Exhausted</span>
                    }
                  </td>

                  <td class="p-3.5 font-mono text-[11px] text-slate-400">
                    {{ n.createdAt | date:'mediumTime' }}
                  </td>

                  <td class="p-3.5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      @if (n.status === 'FAILED') {
                        <button
                          type="button"
                          (click)="retryNotification(n.id)"
                          title="Retry Job"
                          class="p-1 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                          <mat-icon class="text-base">replay</mat-icon>
                        </button>
                      }

                      <button
                        type="button"
                        (click)="selectNotification.emit(n)"
                        class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Inspect Delivery Attempts">
                        <mat-icon class="text-base">info</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="p-3.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {{ currentPage() }} of {{ totalPages() }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              [disabled]="currentPage() <= 1"
              (click)="changePage(currentPage() - 1)"
              class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer">
              Previous
            </button>
            <button
              type="button"
              [disabled]="currentPage() >= totalPages()"
              (click)="changePage(currentPage() + 1)"
              class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer">
              Next
            </button>
          </div>
        </div>

      </div>

    </div>
  `
})
export class NotificationsList implements OnInit {
  private api = inject(Api);
  private toast = inject(Toast);

  public initialTab = input<string>('ALL');
  public openComposer = output<void>();
  public selectNotification = output<NotificationItem>();

  public notifications = signal<NotificationItem[]>([]);
  public totalCount = signal<number>(0);
  public currentPage = signal<number>(1);
  public totalPages = signal<number>(1);
  public activeTab = signal<string>('ALL');

  public searchCtrl = new FormControl('');
  public channelCtrl = new FormControl('ALL');
  public priorityCtrl = new FormControl('ALL');

  constructor() {
    this.searchCtrl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadNotifications();
    });
    this.channelCtrl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadNotifications();
    });
    this.priorityCtrl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadNotifications();
    });
  }

  ngOnInit() {
    if (this.initialTab()) {
      this.activeTab.set(this.initialTab());
    }
    this.loadNotifications();
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadNotifications();
  }

  loadNotifications() {
    const statusParam = this.activeTab() === 'ALL' ? undefined : this.activeTab();
    this.api.getNotifications({
      status: statusParam,
      channel: this.channelCtrl.value || undefined,
      priority: this.priorityCtrl.value || undefined,
      search: this.searchCtrl.value || undefined,
      page: this.currentPage(),
      pageSize: 12
    }).subscribe({
      next: (res) => {
        this.notifications.set(res.data);
        this.totalCount.set(res.total);
        this.totalPages.set(res.totalPages || 1);
      },
      error: (err) => this.toast.error('Load Failed', err.message)
    });
  }

  changePage(newPage: number) {
    this.currentPage.set(newPage);
    this.loadNotifications();
  }

  retryNotification(id: string) {
    this.api.retryNotification(id).subscribe({
      next: (res) => {
        this.toast.success('Retrying', res.message);
        this.loadNotifications();
      },
      error: (err) => this.toast.error('Retry Failed', err.message)
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
