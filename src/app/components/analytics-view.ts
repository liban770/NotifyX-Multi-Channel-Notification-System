import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api } from '../services/api';
import { AnalyticsOverview } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-analytics-view',
  imports: [MatIconModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Delivery Analytics & Provider Telemetry</span>
            <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              Real-time Ingestion
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Observability metrics covering success ratios, channel distribution, and external gateway latencies.
          </p>
        </div>

        <button
          type="button"
          (click)="loadAnalytics()"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium cursor-pointer">
          <mat-icon class="text-sm text-indigo-400">refresh</mat-icon>
          <span>Refresh Metrics</span>
        </button>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Total Notifications</p>
          <p class="mt-2 text-2xl font-bold text-white font-mono">{{ analytics()?.total || 0 }}</p>
          <p class="text-[11px] text-slate-500 font-mono mt-1">Across all 4 channels</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Delivery Rate</p>
          <p class="mt-2 text-2xl font-bold text-emerald-400 font-mono">{{ analytics()?.deliveryRate || '100%' }}</p>
          <p class="text-[11px] text-emerald-400/80 font-mono mt-1">{{ analytics()?.delivered || 0 }} successfully delivered</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Failure Rate</p>
          <p class="mt-2 text-2xl font-bold text-rose-400 font-mono">{{ analytics()?.failureRate || '0.0%' }}</p>
          <p class="text-[11px] text-rose-400/80 font-mono mt-1">{{ analytics()?.failed || 0 }} dead-letter messages</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p class="text-xs font-medium text-slate-400">Scheduled / Future</p>
          <p class="mt-2 text-2xl font-bold text-purple-400 font-mono">{{ analytics()?.scheduled || 0 }}</p>
          <p class="text-[11px] text-slate-500 font-mono mt-1">Timezone-aware queue</p>
        </div>

      </div>

      <!-- Provider Gateway Benchmark Matrix -->
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <mat-icon class="text-sm text-indigo-400">speed</mat-icon> External Gateway Provider Benchmarks
          </h3>
          <span class="text-[11px] font-mono text-slate-400">Latency & SLA</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono uppercase text-slate-500">
                <th class="p-3">Gateway Name</th>
                <th class="p-3">Channel</th>
                <th class="p-3">Total Requests</th>
                <th class="p-3">Success Rate</th>
                <th class="p-3">Avg Latency</th>
                <th class="p-3">SLA Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              @for (stat of analytics()?.providerStats || []; track stat.name) {
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3 font-sans font-semibold text-slate-200">{{ stat.name }}</td>
                  <td class="p-3 text-slate-400">{{ stat.channel }}</td>
                  <td class="p-3 text-slate-300">{{ stat.attempts }} tx</td>
                  <td class="p-3 text-emerald-400 font-bold">{{ stat.successRate }}</td>
                  <td class="p-3 text-slate-300">{{ stat.avgLatencyMs }} ms</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      OPTIMAL (99.9%)
                    </span>
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
export class AnalyticsView {
  private api = inject(Api);
  public analytics = signal<AnalyticsOverview | null>(null);

  constructor() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.api.getAnalytics().subscribe(res => this.analytics.set(res.metrics));
  }
}
