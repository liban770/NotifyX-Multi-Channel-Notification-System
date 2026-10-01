import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { DeliveryAttempt, NotificationItem } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { JsonPipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notification-drawer',
  imports: [MatIconModule, JsonPipe],
  template: `
    <div class="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div class="w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        <!-- Drawer Header -->
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-indigo-400 font-semibold">{{ notification().id }}</span>
            <span 
              class="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border"
              [class]="getStatusClasses(notification().status)">
              {{ notification().status }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            @if (notification().status === 'FAILED') {
              <button
                type="button"
                (click)="retry()"
                [disabled]="isRetrying()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer">
                <mat-icon class="text-sm">replay</mat-icon>
                <span>{{ isRetrying() ? 'Re-enqueuing...' : 'Retry Task' }}</span>
              </button>
            }

            @if (notification().status === 'SCHEDULED' || notification().status === 'QUEUED') {
              <button
                type="button"
                (click)="cancel()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium transition-all cursor-pointer">
                <mat-icon class="text-sm">cancel</mat-icon>
                <span>Cancel</span>
              </button>
            }

            <button
              type="button"
              (click)="close.emit()"
              class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <mat-icon class="text-lg">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Drawer Content -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1">
          
          <!-- Key Meta Grid -->
          <div class="grid grid-cols-2 gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div>
              <p class="text-[10px] uppercase font-mono text-slate-400">Recipient</p>
              <p class="text-xs font-mono text-slate-200 truncate mt-0.5">{{ notification().recipient }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase font-mono text-slate-400">Channel</p>
              <p class="text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <mat-icon class="text-sm text-indigo-400">{{ getChannelIcon(notification().channel) }}</mat-icon>
                <span>{{ notification().channel }}</span>
              </p>
            </div>
            <div>
              <p class="text-[10px] uppercase font-mono text-slate-400">Notification Type</p>
              <p class="text-xs font-mono text-slate-300 mt-0.5">{{ notification().notificationType }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase font-mono text-slate-400">Priority Level</p>
              <p class="text-xs font-semibold mt-0.5" [class]="notification().priority === 'CRITICAL' ? 'text-rose-400' : 'text-slate-300'">
                {{ notification().priority }}
              </p>
            </div>
            @if (notification().idempotencyKey) {
              <div class="col-span-2 pt-1 border-t border-slate-800/40">
                <p class="text-[10px] uppercase font-mono text-slate-400">Idempotency Key</p>
                <p class="text-[11px] font-mono text-slate-400 truncate">{{ notification().idempotencyKey }}</p>
              </div>
            }
          </div>

          <!-- Message Payload View -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <mat-icon class="text-sm text-indigo-400">mail</mat-icon> Transmitted Content
            </h4>
            <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div>
                <span class="text-[10px] font-mono text-slate-400">Subject:</span>
                <p class="text-xs font-medium text-slate-200 mt-0.5">{{ notification().subject }}</p>
              </div>
              <div>
                <span class="text-[10px] font-mono text-slate-400">Content Body:</span>
                <p class="text-xs text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">{{ notification().content }}</p>
              </div>
            </div>
          </div>

          <!-- Error Alert if Failed -->
          @if (notification().errorMessage) {
            <div class="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-200">
              <div class="flex items-center gap-2">
                <mat-icon class="text-rose-400 text-sm">warning</mat-icon>
                <span class="text-xs font-semibold">Gateway Rejection Details</span>
              </div>
              <p class="text-xs font-mono text-rose-300 mt-1 leading-normal">{{ notification().errorMessage }}</p>
            </div>
          }

          <!-- Delivery Attempts Timeline (Crucial for section 11) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <mat-icon class="text-sm text-indigo-400">timeline</mat-icon> Delivery Attempts History
              </h4>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {{ attempts().length }} Attempt(s)
              </span>
            </div>

            @if (attempts().length === 0) {
              <div class="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                No delivery attempts recorded yet. Worker task is queued.
              </div>
            }

            <div class="space-y-3">
              @for (att of attempts(); track att.id) {
                <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-300">
                        #{{ att.attemptNumber }}
                      </span>
                      <span class="text-xs font-semibold text-white">{{ att.providerName }}</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        [class]="att.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'">
                        {{ att.status }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      @if (att.httpStatusCode) {
                        <span [class]="att.httpStatusCode < 400 ? 'text-emerald-400' : 'text-rose-400'">
                          HTTP {{ att.httpStatusCode }}
                        </span>
                      }
                      <span>{{ att.executionTimeMs }}ms</span>
                    </div>
                  </div>

                  @if (att.providerMessageId) {
                    <div class="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <span>Message ID:</span>
                      <span class="text-slate-300">{{ att.providerMessageId }}</span>
                    </div>
                  }

                  @if (att.errorDetails) {
                    <p class="text-[11px] font-mono text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/40">
                      {{ att.errorDetails }}
                    </p>
                  }

                  <!-- Raw Gateway Payload Inspector -->
                  <details class="text-[11px] font-mono pt-1 text-slate-500">
                    <summary class="cursor-pointer hover:text-slate-300 transition-colors">
                      View Raw Gateway JSON Response
                    </summary>
                    <pre class="mt-2 p-2.5 bg-slate-900 rounded-lg text-slate-300 text-[10px] overflow-x-auto border border-slate-800/80">{{ att.rawResponse | json }}</pre>
                  </details>
                </div>
              }
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class NotificationDrawer {
  private api = inject(Api);
  private toast = inject(Toast);

  public notification = input.required<NotificationItem>();
  public attempts = input<DeliveryAttempt[]>([]);
  public close = output<void>();
  public refreshed = output<void>();

  public isRetrying = signal<boolean>(false);

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

  retry() {
    this.isRetrying.set(true);
    this.api.retryNotification(this.notification().id).subscribe({
      next: (res) => {
        this.isRetrying.set(false);
        this.toast.success('Retrying Job', res.message);
        this.refreshed.emit();
      },
      error: (err) => {
        this.isRetrying.set(false);
        this.toast.error('Retry Failed', err.message);
      }
    });
  }

  cancel() {
    this.api.cancelNotification(this.notification().id).subscribe({
      next: (res) => {
        this.toast.info('Cancelled', res.message);
        this.refreshed.emit();
      },
      error: (err) => this.toast.error('Cancel Failed', err.message)
    });
  }
}
