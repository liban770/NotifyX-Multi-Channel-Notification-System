import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { UserPreference } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-preferences-manager',
  imports: [MatIconModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 max-w-4xl">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Recipient Notification Preferences</span>
            <span class="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              Target Profile
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Fine-grained channel opt-ins, quiet hours suppression window, and timezone-aware routing.
          </p>
        </div>

        <button
          type="button"
          (click)="savePreferences()"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
          <mat-icon class="text-sm">save</mat-icon>
          <span>Save Preferences</span>
        </button>
      </div>

      <!-- Form Container -->
      <form [formGroup]="form" class="space-y-6">
        
        <!-- Recipient Selector -->
        <div class="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-white">Active Recipient Profile</p>
            <p class="text-[11px] font-mono text-slate-400">Target email used to resolve channel routing rules during dispatch</p>
          </div>
          <div class="flex items-center gap-2">
            <input 
              type="text" 
              [formControl]="emailCtrl"
              class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 w-64">
            <button
              type="button"
              (click)="loadPreferences(emailCtrl.value || '')"
              class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer">
              Load
            </button>
          </div>
        </div>

        <!-- Channel Toggles Grid -->
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <mat-icon class="text-sm text-indigo-400">devices</mat-icon> Communication Channels
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Toggle delivery channels for non-critical messages.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Email -->
            <label class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <mat-icon class="text-base">email</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">Email Channel</p>
                  <p class="text-[11px] text-slate-400">SendGrid & SES transactional receipts</p>
                </div>
              </div>
              <input type="checkbox" formControlName="emailEnabled" class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4">
            </label>

            <!-- SMS -->
            <label class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <mat-icon class="text-base">sms</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">SMS Messaging</p>
                  <p class="text-[11px] text-slate-400">Twilio international SMS carriers</p>
                </div>
              </div>
              <input type="checkbox" formControlName="smsEnabled" class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4">
            </label>

            <!-- Push -->
            <label class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <mat-icon class="text-base">notifications_active</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">Push Notifications</p>
                  <p class="text-[11px] text-slate-400">Firebase Cloud Messaging device alerts</p>
                </div>
              </div>
              <input type="checkbox" formControlName="pushEnabled" class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4">
            </label>

            <!-- In-App -->
            <label class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <mat-icon class="text-base">inbox</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">In-App Notification Center</p>
                  <p class="text-[11px] text-slate-400">Live browser bell & inbox delivery</p>
                </div>
              </div>
              <input type="checkbox" formControlName="inAppEnabled" class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4">
            </label>

          </div>
        </div>

        <!-- Categories & Critical Override -->
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div class="border-b border-slate-800 pb-3">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <mat-icon class="text-sm text-indigo-400">category</mat-icon> Notification Categories
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Control which notification types this recipient agrees to receive.</p>
          </div>

          <div class="space-y-3">
            
            <!-- Security Alerts (Mandatory) -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <mat-icon class="text-base">security</mat-icon>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-semibold text-white">Security Alerts & Two-Factor OTPs</p>
                    <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">Mandatory</span>
                  </div>
                  <p class="text-[11px] text-slate-400">System security rules enforce delivery even if quiet hours are active.</p>
                </div>
              </div>
              <input type="checkbox" checked disabled class="rounded bg-slate-800 border-slate-700 text-rose-600 h-4 w-4 opacity-70 cursor-not-allowed">
            </div>

            <!-- Transactional -->
            <label class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <mat-icon class="text-base">receipt_long</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">Transactional & Billing Notices</p>
                  <p class="text-[11px] text-slate-400">Invoices, payment receipts, subscription renewals.</p>
                </div>
              </div>
              <input type="checkbox" formControlName="transactionalOptIn" class="rounded bg-slate-900 border-slate-700 text-indigo-600 h-4 w-4">
            </label>

            <!-- Marketing -->
            <label class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <mat-icon class="text-base">campaign</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">Product Updates & Marketing</p>
                  <p class="text-[11px] text-slate-400">Feature launches, newsletter recaps, and promotional campaigns.</p>
                </div>
              </div>
              <input type="checkbox" formControlName="marketingOptIn" class="rounded bg-slate-900 border-slate-700 text-indigo-600 h-4 w-4">
            </label>

          </div>
        </div>

        <!-- Quiet Hours & Timezone -->
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <mat-icon class="text-sm text-indigo-400">bedtime</mat-icon> Quiet Hours Suppression Window
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Non-critical notifications sent during this window will be queued until morning.</p>
            </div>
            
            <input type="checkbox" formControlName="quietHoursEnabled" class="rounded bg-slate-900 border-slate-700 text-indigo-600 h-4 w-4">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Window Starts (Sleep)</label>
              <input 
                type="time" 
                formControlName="quietHoursStart"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Window Ends (Wake)</label>
              <input 
                type="time" 
                formControlName="quietHoursEnd"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Recipient Timezone</label>
              <select 
                formControlName="timezone"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="Africa/Mogadishu">Africa/Mogadishu (UTC+3)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>
          </div>
        </div>

      </form>

    </div>
  `
})
export class PreferencesManager {
  private api = inject(Api);
  private toast = inject(Toast);

  public emailCtrl = new FormControl('ahmedlibanmohamed89@gmail.com');

  public form = new FormGroup({
    emailEnabled: new FormControl(true),
    smsEnabled: new FormControl(true),
    pushEnabled: new FormControl(true),
    inAppEnabled: new FormControl(true),
    transactionalOptIn: new FormControl(true),
    marketingOptIn: new FormControl(false),
    quietHoursEnabled: new FormControl(true),
    quietHoursStart: new FormControl('22:00'),
    quietHoursEnd: new FormControl('07:30'),
    timezone: new FormControl('Africa/Mogadishu'),
  });

  constructor() {
    this.loadPreferences(this.emailCtrl.value || 'ahmedlibanmohamed89@gmail.com');
  }

  loadPreferences(email: string) {
    this.api.getPreferences(email).subscribe({
      next: (res) => {
        const p = res.data;
        this.form.patchValue({
          emailEnabled: p.emailEnabled,
          smsEnabled: p.smsEnabled,
          pushEnabled: p.pushEnabled,
          inAppEnabled: p.inAppEnabled,
          transactionalOptIn: p.transactionalOptIn,
          marketingOptIn: p.marketingOptIn,
          quietHoursEnabled: p.quietHoursEnabled,
          quietHoursStart: p.quietHoursStart,
          quietHoursEnd: p.quietHoursEnd,
          timezone: p.timezone,
        });
        this.toast.info('Preferences Loaded', `Fetched preferences for ${email}`);
      },
      error: (err) => this.toast.error('Load Failed', err.message)
    });
  }

  savePreferences() {
    const val = this.form.getRawValue();
    const payload: Partial<UserPreference> & { email?: string } = {
      email: this.emailCtrl.value || 'ahmedlibanmohamed89@gmail.com',
      emailEnabled: val.emailEnabled ?? true,
      smsEnabled: val.smsEnabled ?? true,
      pushEnabled: val.pushEnabled ?? true,
      inAppEnabled: val.inAppEnabled ?? true,
      transactionalOptIn: val.transactionalOptIn ?? true,
      marketingOptIn: val.marketingOptIn ?? false,
      quietHoursEnabled: val.quietHoursEnabled ?? false,
      quietHoursStart: val.quietHoursStart ?? '22:00',
      quietHoursEnd: val.quietHoursEnd ?? '07:30',
      timezone: val.timezone ?? 'Africa/Mogadishu',
    };

    this.api.updatePreferences(payload).subscribe({
      next: (res) => {
        this.toast.success('Saved', res.message);
      },
      error: (err) => this.toast.error('Save Failed', err.message)
    });
  }
}
