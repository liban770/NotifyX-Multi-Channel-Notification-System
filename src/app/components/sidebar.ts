import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type NavTab = 
  | 'dashboard'
  | 'notifications'
  | 'templates'
  | 'providers'
  | 'preferences'
  | 'api-keys'
  | 'analytics'
  | 'audit-logs'
  | 'queue';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  imports: [MatIconModule],
  template: `
    <aside class="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div class="p-4 space-y-6 overflow-y-auto">
        <!-- Main Navigation Group -->
        <div class="space-y-1">
          <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">Core Platform</p>
          
          <button
            type="button"
            (click)="selectTab('dashboard')"
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-lg">dashboard</mat-icon>
              <span>Dashboard</span>
            </div>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">Live</span>
          </button>

          <button
            type="button"
            (click)="selectTab('notifications')"
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'notifications' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-lg">mark_email_read</mat-icon>
              <span>Notifications</span>
            </div>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Hub</span>
          </button>

          <button
            type="button"
            (click)="selectTab('templates')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'templates' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <mat-icon class="text-lg">integration_instructions</mat-icon>
            <span>Templates</span>
          </button>
        </div>

        <!-- Infrastructure & Routing -->
        <div class="space-y-1">
          <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">Infrastructure</p>

          <button
            type="button"
            (click)="selectTab('providers')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'providers' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <mat-icon class="text-lg">hub</mat-icon>
            <span>Channels & Providers</span>
          </button>

          <button
            type="button"
            (click)="selectTab('preferences')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'preferences' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <mat-icon class="text-lg">tune</mat-icon>
            <span>Recipient Preferences</span>
          </button>

          <button
            type="button"
            (click)="selectTab('api-keys')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'api-keys' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <mat-icon class="text-lg">key</mat-icon>
            <span>API & Integrations</span>
          </button>
        </div>

        <!-- Observability -->
        <div class="space-y-1">
          <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">Observability</p>

          <button
            type="button"
            (click)="selectTab('analytics')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'analytics' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <mat-icon class="text-lg">analytics</mat-icon>
            <span>Delivery Analytics</span>
          </button>

          <button
            type="button"
            (click)="selectTab('queue')"
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'queue' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-lg">dns</mat-icon>
              <span>Queue & Workers</span>
            </div>
            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </button>

          <button
            type="button"
            (click)="selectTab('audit-logs')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            [class]="activeTab() === 'audit-logs' ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'">
            <mat-icon class="text-lg">history</mat-icon>
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      <!-- Bottom System Status Card -->
      <div class="p-4 border-t border-slate-900 bg-slate-950/40">
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold text-slate-300">Cluster Status</span>
            <span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 99.98%
            </span>
          </div>
          <div class="mt-2 text-[10px] text-slate-400 font-mono space-y-1">
            <div class="flex justify-between">
              <span>Broker:</span> <span class="text-slate-300">Redis 7.2 (Ready)</span>
            </div>
            <div class="flex justify-between">
              <span>Workers:</span> <span class="text-emerald-400">4 Active Nodes</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class Sidebar {
  public activeTab = input.required<NavTab>();
  public tabChange = output<NavTab>();

  selectTab(tab: NavTab) {
    this.tabChange.emit(tab);
  }
}
