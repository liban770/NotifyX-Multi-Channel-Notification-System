import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-queue-monitor',
  imports: [MatIconModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Celery & Redis Asynchronous Queue Architecture</span>
            <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Broker Online
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Non-blocking task ingestion with isolated priority queues, exponential backoff retries, and worker heartbeats.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="simulateStressBurst()"
            [disabled]="isBursting()"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
            <mat-icon class="text-sm">bolt</mat-icon>
            <span>{{ isBursting() ? 'Enqueuing 25 Jobs...' : 'Simulate 25-Job Burst' }}</span>
          </button>

          <button
            type="button"
            (click)="loadStatus()"
            class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer">
            <mat-icon class="text-base">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Architecture Pipeline Card -->
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 font-mono">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <mat-icon class="text-sm text-indigo-400">alt_route</mat-icon> Worker Ingestion Pipeline
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <p class="text-[10px] text-slate-500 uppercase">Step 1</p>
            <p class="font-bold text-white mt-1">REST API Handler</p>
            <p class="text-[11px] text-slate-400 mt-1">&lt; 15ms non-blocking ACK</p>
          </div>
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <p class="text-[10px] text-slate-500 uppercase">Step 2</p>
            <p class="font-bold text-indigo-400 mt-1">Redis Broker</p>
            <p class="text-[11px] text-slate-400 mt-1">Priority queues & DLQ</p>
          </div>
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <p class="text-[10px] text-slate-500 uppercase">Step 3</p>
            <p class="font-bold text-emerald-400 mt-1">Celery Worker Pool</p>
            <p class="text-[11px] text-slate-400 mt-1">Prefetch = 1, Concurrency 8</p>
          </div>
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <p class="text-[10px] text-slate-500 uppercase">Step 4</p>
            <p class="font-bold text-purple-400 mt-1">Delivery Logged</p>
            <p class="text-[11px] text-slate-400 mt-1">Attempt records + metrics</p>
          </div>
        </div>
      </div>

      <!-- Telemetry Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span class="text-xs font-medium text-slate-400">Broker Status</span>
          <p class="text-sm font-bold text-emerald-400 font-mono mt-2">CONNECTED</p>
          <p class="text-[11px] text-slate-500 font-mono mt-0.5">redis://localhost:6379/0</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span class="text-xs font-medium text-slate-400">Currently Queued</span>
          <p class="text-2xl font-bold text-sky-400 font-mono mt-1">{{ queue()?.currentPendingNotifs || 0 }}</p>
          <p class="text-[11px] text-slate-500 font-mono mt-0.5">Tasks awaiting thread pickup</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span class="text-xs font-medium text-slate-400">Processing Tasks</span>
          <p class="text-2xl font-bold text-indigo-400 font-mono mt-1">{{ queue()?.currentProcessingNotifs || 0 }}</p>
          <p class="text-[11px] text-slate-500 font-mono mt-0.5">Active worker socket I/O</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span class="text-xs font-medium text-slate-400">Worker Nodes</span>
          <p class="text-2xl font-bold text-white font-mono mt-1">{{ queue()?.activeWorkers || 4 }}</p>
          <p class="text-[11px] text-emerald-400 font-mono mt-0.5">All heartbeats optimal</p>
        </div>

      </div>

      <!-- Worker Pings & Priority Queues List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Priority Queues -->
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <mat-icon class="text-sm text-indigo-400">tune</mat-icon> Priority Task Queues
          </h3>

          <div class="space-y-2 text-xs font-mono">
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="font-bold text-rose-400">high_priority</span>
                <p class="text-[11px] text-slate-400 font-sans mt-0.5">Security OTPs, Password Resets, 2FA</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Prefetch Max
              </span>
            </div>

            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="font-bold text-indigo-400">default</span>
                <p class="text-[11px] text-slate-400 font-sans mt-0.5">Order receipts, welcome onboarding, alerts</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Balanced
              </span>
            </div>

            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-300">bulk</span>
                <p class="text-[11px] text-slate-400 font-sans mt-0.5">Marketing newsletters, product digests</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                Throttled
              </span>
            </div>
          </div>
        </div>

        <!-- Worker Nodes -->
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <mat-icon class="text-sm text-emerald-400">dns</mat-icon> Active Celery Worker Nodes
          </h3>

          <div class="space-y-2 text-xs font-mono">
            @for (worker of queue()?.workerPings || []; track worker) {
              <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="text-slate-200">{{ worker }}</span>
                </div>
                <span class="text-emerald-400 text-[11px]">Heartbeat OK</span>
              </div>
            }
          </div>
        </div>

      </div>

    </div>
  `
})
export class QueueMonitor {
  private api = inject(Api);
  private toast = inject(Toast);

  public queue = signal<any>(null);
  public isBursting = signal<boolean>(false);

  constructor() {
    this.loadStatus();
  }

  loadStatus() {
    this.api.getQueueStatus().subscribe(res => this.queue.set(res.queue));
  }

  simulateStressBurst() {
    this.isBursting.set(true);
    const burstItems = [];
    const channels = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];
    for (let i = 1; i <= 25; i++) {
      burstItems.push({
        recipient: `stress.user_${i}@acmepay.com`,
        channel: channels[i % channels.length],
        event: 'billing.payment_reminder',
        subject: `Automated Settlement Notice #${i}`,
        content: `Synthetic stress test load payload batch #${i} verifying async delivery.`,
        priority: i % 5 === 0 ? 'CRITICAL' : 'NORMAL'
      });
    }

    this.api.bulkSendNotifications(burstItems).subscribe({
      next: (res) => {
        this.isBursting.set(false);
        this.toast.success('Burst Ingested', `Pushed ${res.enqueuedCount} tasks to Redis. Watch queue processor work!`);
        this.loadStatus();
      },
      error: (err) => {
        this.isBursting.set(false);
        this.toast.error('Burst Failed', err.message);
      }
    });
  }
}
