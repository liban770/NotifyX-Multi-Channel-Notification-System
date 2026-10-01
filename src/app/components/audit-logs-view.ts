import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api } from '../services/api';
import { AuditLogItem } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, JsonPipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-audit-logs-view',
  imports: [MatIconModule, DatePipe, JsonPipe],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Security & Compliance Audit Trail</span>
            <span class="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              Immutable Log
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped audit log of all system administrative actions, key rotations, and dispatches.
          </p>
        </div>

        <button
          type="button"
          (click)="loadAuditLogs()"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium cursor-pointer">
          <mat-icon class="text-sm text-indigo-400">refresh</mat-icon>
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <!-- Logs Table -->
      <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase text-slate-500">
                <th class="p-3.5">Timestamp</th>
                <th class="p-3.5">Actor & Role</th>
                <th class="p-3.5">Action Event</th>
                <th class="p-3.5">Target Resource</th>
                <th class="p-3.5">IP Gateway</th>
                <th class="p-3.5 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (log of logs(); track log.id) {
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3.5 text-slate-400 whitespace-nowrap">
                    {{ log.timestamp | date:'medium' }}
                  </td>
                  
                  <td class="p-3.5">
                    <p class="text-slate-200 font-sans font-medium">{{ log.actorEmail }}</p>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {{ log.actorRole }}
                    </span>
                  </td>

                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {{ log.action }}
                    </span>
                  </td>

                  <td class="p-3.5 text-slate-300">
                    <span>{{ log.resourceType }}</span>
                    @if (log.resourceId) {
                      <span class="text-slate-500 text-[11px] ml-1 truncate max-w-[120px] inline-block align-bottom">
                        ({{ log.resourceId }})
                      </span>
                    }
                  </td>

                  <td class="p-3.5 text-slate-400 text-[11px]">
                    {{ log.ipAddress }}
                  </td>

                  <td class="p-3.5 text-right">
                    <button
                      type="button"
                      (click)="selectedLog.set(log)"
                      class="text-indigo-400 hover:text-indigo-300 text-xs hover:underline cursor-pointer">
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- JSON Inspector Modal -->
      @if (selectedLog()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 class="text-sm font-semibold text-white tracking-tight font-mono">
                Audit Event: {{ selectedLog()!.action }}
              </h3>
              <button (click)="selectedLog.set(null)" class="text-slate-400 hover:text-white p-1 cursor-pointer">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <div class="p-6 space-y-3">
              <div class="text-xs text-slate-400 font-mono space-y-1">
                <div>Actor: <span class="text-slate-200">{{ selectedLog()!.actorEmail }}</span></div>
                <div>Timestamp: <span class="text-slate-200">{{ selectedLog()!.timestamp }}</span></div>
              </div>
              
              <pre class="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800">{{ selectedLog()!.metadata | json }}</pre>
            </div>

            <div class="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button 
                type="button" 
                (click)="selectedLog.set(null)"
                class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer">
                Close
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class AuditLogsView {
  private api = inject(Api);
  public logs = signal<AuditLogItem[]>([]);
  public selectedLog = signal<AuditLogItem | null>(null);

  constructor() {
    this.loadAuditLogs();
  }

  loadAuditLogs() {
    this.api.getAuditLogs().subscribe(res => this.logs.set(res.data));
  }
}
