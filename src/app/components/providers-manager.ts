import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { ProviderConfig } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { JsonPipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-providers-manager',
  imports: [MatIconModule, JsonPipe],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Communication Providers & Gateway Adapters</span>
            <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              Circuit-Breaker Protected
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Pluggable provider abstraction layer decoupling notification business logic from external vendors.
          </p>
        </div>

        <button
          type="button"
          (click)="pingAll()"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer">
          <mat-icon class="text-sm text-indigo-400">sync</mat-icon>
          <span>Ping All Adapters</span>
        </button>
      </div>

      <!-- Architecture Diagram Callout -->
      <div class="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs font-mono text-indigo-200">
        <div class="flex items-center gap-2 font-semibold text-indigo-300 mb-1">
          <mat-icon class="text-base">alt_route</mat-icon> Failover Routing Mechanism
        </div>
        <p class="text-slate-400 leading-relaxed text-[11px]">
          If a primary provider encounters 3 consecutive timeouts or HTTP 5xx responses, the circuit breaker opens and the dispatcher automatically routes subsequent retry jobs to the Tier 2 fallback provider without downtime.
        </p>
      </div>

      <!-- Provider Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (p of providers(); track p.id) {
          <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
            
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center border"
                    [class]="p.channel === 'EMAIL' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                             p.channel === 'SMS' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                             p.channel === 'PUSH' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                             'bg-sky-500/10 border-sky-500/30 text-sky-400'">
                    <mat-icon class="text-lg">{{ getChannelIcon(p.channel) }}</mat-icon>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-white tracking-tight">{{ p.name }}</h3>
                    <p class="text-xs font-mono text-slate-400">{{ p.channel }} Channel / {{ p.providerType }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded border"
                    [class]="p.healthStatus === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'">
                    {{ p.healthStatus }}
                  </span>
                </div>
              </div>

              <!-- Latency & Priority Tags -->
              <div class="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-center font-mono">
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block">Failover Tier</span>
                  <span class="text-xs font-semibold text-slate-200">
                    {{ p.priority === 1 ? 'Primary (Tier 1)' : 'Fallback (Tier 2)' }}
                  </span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block">Last Ping</span>
                  <span class="text-xs font-semibold text-emerald-400">{{ p.lastPingMs }} ms</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block">State</span>
                  <span class="text-xs font-semibold" [class]="p.isActive ? 'text-indigo-400' : 'text-slate-500'">
                    {{ p.isActive ? 'Active' : 'Disabled' }}
                  </span>
                </div>
              </div>

              <!-- Configuration settings preview -->
              <div>
                <span class="text-[11px] font-mono text-slate-500">Gateway Config:</span>
                <pre class="mt-1 p-2 bg-slate-950 rounded-lg text-slate-300 text-[10px] font-mono overflow-x-auto border border-slate-800/80">{{ p.settings | json }}</pre>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                type="button"
                (click)="toggleActive(p)"
                class="text-xs font-mono transition-colors cursor-pointer"
                [class]="p.isActive ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'">
                {{ p.isActive ? 'Disable Adapter' : 'Enable Adapter' }}
              </button>

              <button
                type="button"
                (click)="testProvider(p.id)"
                [disabled]="testingId() === p.id"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium transition-all cursor-pointer">
                <mat-icon class="text-xs">{{ testingId() === p.id ? 'sync' : 'network_check' }}</mat-icon>
                <span>{{ testingId() === p.id ? 'Testing...' : 'Synthetic Ping' }}</span>
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class ProvidersManager {
  private api = inject(Api);
  private toast = inject(Toast);

  public providers = signal<ProviderConfig[]>([]);
  public testingId = signal<string | null>(null);

  constructor() {
    this.loadProviders();
  }

  loadProviders() {
    this.api.getProviders().subscribe({
      next: (res) => this.providers.set(res.data),
      error: (err) => this.toast.error('Load Failed', err.message)
    });
  }

  testProvider(id: string) {
    this.testingId.set(id);
    this.api.testProvider(id).subscribe({
      next: (res) => {
        this.testingId.set(null);
        this.toast.success('Connection Verified', `${res.message} Ping: ${res.latencyMs}ms`);
        this.loadProviders();
      },
      error: (err) => {
        this.testingId.set(null);
        this.toast.error('Ping Failed', err.message);
      }
    });
  }

  pingAll() {
    this.providers().forEach(p => this.testProvider(p.id));
  }

  toggleActive(p: ProviderConfig) {
    this.api.updateProvider(p.id, { isActive: !p.isActive }).subscribe({
      next: () => {
        this.toast.info('Status Changed', `${p.name} is now ${!p.isActive ? 'active' : 'disabled'}.`);
        this.loadProviders();
      },
      error: (err) => this.toast.error('Update Failed', err.message)
    });
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
