import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { Template } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-composer-modal',
  imports: [MatIconModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <mat-icon class="text-xl">send</mat-icon>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-white tracking-tight">Dispatch Notification Job</h3>
              <p class="text-xs text-slate-400">Asynchronous multi-channel orchestrator via Celery & Redis</p>
            </div>
          </div>
          <button 
            type="button" 
            (click)="close.emit()" 
            class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <mat-icon class="text-lg">close</mat-icon>
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1">
          <form [formGroup]="form" class="space-y-4">
            
            <!-- Template / Mode Selection -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Notification Template / Event Type</label>
              <select 
                formControlName="templateId"
                (change)="onTemplateChange()"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                <option value="CUSTOM">Custom Notification (Ad-hoc message)</option>
                @for (tpl of templates(); track tpl.id) {
                  <option [value]="tpl.id">{{ tpl.name }} ({{ tpl.notificationType }})</option>
                }
              </select>
            </div>

            <!-- Recipient -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Recipient Target</label>
              <div class="relative">
                <input 
                  type="text" 
                  formControlName="recipient"
                  placeholder="e.g. ahmedlibanmohamed89@gmail.com or +252615891234"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                <div class="absolute right-3 top-2.5 text-slate-500">
                  <mat-icon class="text-base">alternate_email</mat-icon>
                </div>
              </div>
            </div>

            <!-- Channel Selection (Multi-channel) -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Dispatch Channels (Multi-Channel Routing)</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                @for (ch of availableChannels; track ch.id) {
                  <button
                    type="button"
                    (click)="toggleChannel(ch.id)"
                    class="flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer"
                    [class]="isChannelSelected(ch.id) ? 
                      'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-sm' : 
                      'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'">
                    <mat-icon class="text-base">{{ ch.icon }}</mat-icon>
                    <span>{{ ch.label }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Dynamic Variables (if template selected) -->
            @if (activeTemplate()) {
              <div class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                    <mat-icon class="text-sm">data_object</mat-icon> Template Variables
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">Strictly Validated</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  @for (varKey of activeTemplate()!.requiredVariables; track varKey) {
                    <div>
                      <label class="block text-[11px] font-mono text-slate-300 mb-1">{{ '{{ ' + varKey + ' }}' }}</label>
                      <input 
                        type="text" 
                        [value]="templateVariables()[varKey] || ''"
                        (input)="updateVariable(varKey, $any($event.target).value)"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                    </div>
                  }
                </div>
              </div>
            } @else {
              <!-- Custom Subject & Content -->
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    formControlName="subject"
                    placeholder="Notice Subject"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Notification Body Content</label>
                  <textarea 
                    rows="3"
                    formControlName="content"
                    placeholder="Enter notification message payload..."
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"></textarea>
                </div>
              </div>
            }

            <!-- Priority & Scheduling -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Priority Level</label>
                <select 
                  formControlName="priority"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                  <option value="LOW">Low (Background newsletter)</option>
                  <option value="NORMAL" selected>Normal (Standard transactional)</option>
                  <option value="HIGH">High (Billing / Verification)</option>
                  <option value="CRITICAL">Critical (Security Alert - Bypasses Opt-outs)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Schedule Delivery</label>
                <input 
                  type="datetime-local" 
                  formControlName="scheduledFor"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
              </div>
            </div>

            <!-- Idempotency & Failure Simulation -->
            <div class="pt-2 border-t border-slate-800/80 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400 font-mono text-[11px]">Idempotency-Key:</span>
                <span class="text-slate-300 font-mono text-[11px]">{{ idempotencyKey() }}</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-base text-amber-400">bug_report</mat-icon>
                  <div>
                    <p class="text-xs font-medium text-slate-200">Simulate Carrier/Provider Outage</p>
                    <p class="text-[10px] text-slate-400">Triggers 500 error & Celery retry policy</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  formControlName="simulateFailure"
                  class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4">
              </div>
            </div>

          </form>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button 
            type="button" 
            (click)="close.emit()" 
            class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </button>

          <button 
            type="button" 
            (click)="submit()"
            [disabled]="isSubmitting() || selectedChannels().length === 0"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer">
            <mat-icon class="text-sm">send</mat-icon>
            <span>{{ isSubmitting() ? 'Dispatching to Queue...' : 'Enqueue Dispatch' }}</span>
          </button>
        </div>

      </div>
    </div>
  `
})
export class ComposerModal {
  private api = inject(Api);
  private toast = inject(Toast);

  public templates = input<Template[]>([]);
  public close = output<void>();
  public dispatched = output<void>();

  public isSubmitting = signal<boolean>(false);
  public selectedChannels = signal<string[]>(['EMAIL', 'IN_APP']);
  public activeTemplate = signal<Template | null>(null);
  public templateVariables = signal<Record<string, string>>({});
  public idempotencyKey = signal<string>(`idemp_${Math.random().toString(36).substring(2, 10)}`);

  public availableChannels = [
    { id: 'EMAIL', label: 'Email', icon: 'email' },
    { id: 'SMS', label: 'SMS', icon: 'sms' },
    { id: 'PUSH', label: 'Push', icon: 'notifications_active' },
    { id: 'IN_APP', label: 'In-App', icon: 'inbox' },
  ];

  public form = new FormGroup({
    templateId: new FormControl('CUSTOM'),
    recipient: new FormControl('ahmedlibanmohamed89@gmail.com', [Validators.required]),
    subject: new FormControl('Payment Receipt #49120'),
    content: new FormControl('Your monthly payment has been processed successfully. Thank you for choosing NotifyX.'),
    priority: new FormControl('NORMAL'),
    scheduledFor: new FormControl(''),
    simulateFailure: new FormControl(false),
  });

  isChannelSelected(id: string): boolean {
    return this.selectedChannels().includes(id);
  }

  toggleChannel(id: string) {
    this.selectedChannels.update(current => {
      if (current.includes(id)) {
        return current.length > 1 ? current.filter(c => c !== id) : current;
      } else {
        return [...current, id];
      }
    });
  }

  onTemplateChange() {
    const tplId = this.form.get('templateId')?.value;
    if (tplId === 'CUSTOM' || !tplId) {
      this.activeTemplate.set(null);
      this.templateVariables.set({});
    } else {
      const tpl = this.templates().find(t => t.id === tplId) || null;
      this.activeTemplate.set(tpl);
      if (tpl) {
        // Pre-fill default test values for variables
        const initialVars: Record<string, string> = {};
        for (const v of tpl.requiredVariables) {
          if (v === 'user_name') initialVars[v] = 'Ahmed Mohamed';
          else if (v === 'account_name') initialVars[v] = 'NotifyX FinTech';
          else if (v === 'otp_code') initialVars[v] = '849201';
          else if (v === 'expiry_minutes') initialVars[v] = '10';
          else if (v === 'invoice_id') initialVars[v] = 'INV-2026-901';
          else if (v === 'amount') initialVars[v] = '$499.00 USD';
          else if (v === 'due_date') initialVars[v] = 'Oct 15, 2026';
          else if (v === 'maintenance_window') initialVars[v] = 'Saturday 02:00-03:00 UTC';
          else initialVars[v] = `value_${v}`;
        }
        this.templateVariables.set(initialVars);
      }
    }
  }

  updateVariable(key: string, val: string) {
    this.templateVariables.update(v => ({ ...v, [key]: val }));
  }

  submit() {
    if (this.form.invalid) {
      this.toast.error('Validation Error', 'Please specify a recipient target.');
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.form.value;

    const payload: any = {
      recipient: formVal.recipient,
      channels: this.selectedChannels(),
      priority: formVal.priority,
      scheduledFor: formVal.scheduledFor || null,
      idempotencyKey: this.idempotencyKey(),
      simulateFailure: formVal.simulateFailure,
    };

    if (this.activeTemplate()) {
      payload.event = this.activeTemplate()!.notificationType;
      payload.data = this.templateVariables();
    } else {
      payload.event = 'custom.adhoc';
      payload.subject = formVal.subject;
      payload.content = formVal.content;
    }

    this.api.sendNotification(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toast.success(
          'Enqueued Successfully',
          `Created ${res.dispatchedCount} asynchronous delivery task(s) on Redis broker.`
        );
        this.dispatched.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errObj = err.error?.error;
        this.toast.error(
          errObj?.code || 'Dispatch Failed',
          errObj?.message || 'Failed to communicate with notification gateway.'
        );
      }
    });
  }
}
