import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { UserRole } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [MatIconModule, DatePipe],
  template: `
    <header class="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <!-- Left: Logo & Brand + Org -->
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div class="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <mat-icon class="text-indigo-400 text-lg">bolt</mat-icon>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-white tracking-tight text-base">Notify<span class="text-indigo-400">X</span></span>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">v1.4-prod</span>
            </div>
            <p class="text-[11px] text-slate-400 leading-none">Enterprise Notification Engine</p>
          </div>
        </div>

        <!-- Vertical divider -->
        <div class="h-6 w-px bg-slate-800 hidden sm:block"></div>

        <!-- Active Organization -->
        <div class="hidden md:flex items-center gap-2 text-xs bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-300">
          <mat-icon class="text-xs text-indigo-400">domain</mat-icon>
          <span class="font-medium text-slate-200">{{ api.currentOrg()?.name || 'Acme Global FinTech' }}</span>
          <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded">Enterprise</span>
        </div>
      </div>

      <!-- Right: Role Switcher, In-App Bell, Quick Dispatch, Profile -->
      <div class="flex items-center gap-3">
        <!-- RBAC Persona Switcher (Crucial for testing RBAC) -->
        <div class="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
          <span class="text-[11px] font-mono text-slate-400 pl-1.5 pr-1 flex items-center gap-1">
            <mat-icon class="text-xs text-slate-400">badge</mat-icon> Role:
          </span>
          @for (role of availableRoles; track role) {
            <button
              type="button"
              (click)="selectRole(role)"
              class="px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer"
              [class]="api.activeRole() === role ? 
                'bg-indigo-600 text-white shadow-sm' : 
                'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'">
              {{ formatRole(role) }}
            </button>
          }
        </div>

        <!-- In-App Notification Bell & Dropdown -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleInAppDropdown()"
            class="relative p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
            <mat-icon class="text-xl">notifications</mat-icon>
            @if (api.inAppUnreadCount() > 0) {
              <span class="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-950 animate-pulse">
                {{ api.inAppUnreadCount() }}
              </span>
            }
          </button>

          <!-- In-App Dropdown Popover -->
          @if (showInAppDropdown()) {
            <div class="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              <div class="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-indigo-400 text-sm">inbox</mat-icon>
                  <h4 class="text-xs font-semibold text-white uppercase tracking-wider">In-App Notifications</h4>
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">
                    {{ api.inAppUnreadCount() }} new
                  </span>
                </div>
                <button
                  type="button"
                  (click)="markAllRead()"
                  class="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer">
                  Mark all read
                </button>
              </div>

              <div class="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                @if (api.inAppMessages().length === 0) {
                  <div class="p-6 text-center text-slate-500 text-xs">
                    No in-app notifications received yet.
                  </div>
                }
                @for (msg of api.inAppMessages(); track msg.id) {
                  <div 
                    (click)="markSingleRead(msg.id)"
                    class="p-3 hover:bg-slate-800/40 transition-colors cursor-pointer flex items-start gap-2.5"
                    [class]="msg.isRead ? 'opacity-70' : 'bg-indigo-950/15'">
                    <div class="mt-0.5">
                      @if (msg.category === 'SECURITY') {
                        <mat-icon class="text-amber-400 text-base">security</mat-icon>
                      } @else if (msg.category === 'TEMPLATES') {
                        <mat-icon class="text-sky-400 text-base">style</mat-icon>
                      } @else {
                        <mat-icon class="text-indigo-400 text-base">forward_to_inbox</mat-icon>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold text-slate-200 truncate">{{ msg.title }}</p>
                        <span class="text-[10px] text-slate-500 font-mono">{{ msg.createdAt | date:'shortTime' }}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{{ msg.message }}</p>
                    </div>
                  </div>
                }
              </div>

              <div class="p-2 border-t border-slate-800 bg-slate-950/60 text-center">
                <span class="text-[10px] text-slate-400 font-mono">Real-time WebSocket & SSE Ingestion</span>
              </div>
            </div>
          }
        </div>

        <!-- Quick Compose CTA -->
        <button
          type="button"
          (click)="openComposer.emit()"
          class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
          <mat-icon class="text-sm">send</mat-icon>
          <span>Dispatch</span>
        </button>

        <!-- Current User Avatar -->
        <div class="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-200">
            A
          </div>
          <div class="hidden lg:block text-left">
            <p class="text-xs font-medium text-slate-200 leading-tight">Ahmed Mohamed</p>
            <p class="text-[10px] text-slate-400 font-mono leading-tight">ahmedlibanmohamed89&#64;gmail.com</p>
          </div>
        </div>
      </div>
    </header>
  `
})
export class Header {
  public api = inject(Api);
  private toast = inject(Toast);

  public openComposer = output<void>();
  public showInAppDropdown = signal<boolean>(false);

  public availableRoles: UserRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'STAFF_USER'];

  formatRole(role: UserRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ORG_ADMIN': return 'Org Admin';
      case 'STAFF_USER': return 'Staff';
      default: return role;
    }
  }

  selectRole(role: UserRole) {
    this.api.switchRole(role).subscribe({
      next: () => {
        this.toast.info('Role Switched', `Active permissions changed to ${this.formatRole(role)}.`);
      },
      error: (err) => this.toast.error('Switch Failed', err.message)
    });
  }

  toggleInAppDropdown() {
    this.showInAppDropdown.update(v => !v);
  }

  markAllRead() {
    this.api.markInAppRead('all').subscribe(() => {
      this.toast.success('Updated', 'All in-app notifications marked as read.');
      this.showInAppDropdown.set(false);
    });
  }

  markSingleRead(id: string) {
    this.api.markInAppRead(id).subscribe();
  }
}
