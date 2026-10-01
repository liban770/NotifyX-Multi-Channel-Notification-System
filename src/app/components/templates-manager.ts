import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { Template } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-templates-manager',
  imports: [MatIconModule, ReactiveFormsModule, DatePipe],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Notification Templates</span>
            <span class="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              Variable-Validated
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Channel-specific templates with dynamic variable interpolation and strict schemas.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
          <mat-icon class="text-sm">add</mat-icon>
          <span>Create Template</span>
        </button>
      </div>

      <!-- Templates Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (tpl of templates(); track tpl.id) {
          <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-sm flex flex-col justify-between space-y-4">
            
            <div>
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-white tracking-tight">{{ tpl.name }}</h3>
                  <p class="text-xs font-mono text-indigo-400 mt-0.5">{{ tpl.notificationType }}</p>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    v{{ tpl.version }}
                  </span>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {{ tpl.status }}
                  </span>
                </div>
              </div>

              <!-- Subject & Body snippet -->
              <div class="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1">
                <div class="text-slate-400 truncate">
                  <span class="text-slate-500">Subject:</span> {{ tpl.subjectTemplate }}
                </div>
                <div class="text-slate-300 line-clamp-2 leading-relaxed">
                  {{ tpl.bodyTemplate }}
                </div>
              </div>

              <!-- Supported Channels & Variables tags -->
              <div class="mt-3 flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] font-mono text-slate-500 uppercase">Channels:</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Email</span>
                @if (tpl.channelVariants.SMS) {
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">SMS</span>
                }
                @if (tpl.channelVariants.PUSH) {
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Push</span>
                }
                @if (tpl.channelVariants.IN_APP) {
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">In-App</span>
                }
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-1">
                <span class="text-[10px] font-mono text-slate-500">Vars:</span>
                @for (v of tpl.requiredVariables; track v) {
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {{ formatTag(v) }}
                  </span>
                }
              </div>
            </div>

            <!-- Card Actions -->
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span class="text-[10px] font-mono text-slate-500">
                Updated {{ tpl.updatedAt | date:'mediumDate' }}
              </span>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="openPreviewModal(tpl)"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium transition-colors cursor-pointer">
                  <mat-icon class="text-xs">visibility</mat-icon>
                  <span>Test Render</span>
                </button>

                <button
                  type="button"
                  (click)="openEditModal(tpl)"
                  class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Template">
                  <mat-icon class="text-base">edit</mat-icon>
                </button>

                <button
                  type="button"
                  (click)="deleteTemplate(tpl.id)"
                  class="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Delete Template">
                  <mat-icon class="text-base">delete</mat-icon>
                </button>
              </div>
            </div>

          </div>
        }
      </div>

      <!-- Create / Edit Template Modal -->
      @if (showEditorModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 class="text-sm font-semibold text-white tracking-tight">
                {{ editingTemplate() ? 'Edit Template: ' + editingTemplate()!.name : 'Create Notification Template' }}
              </h3>
              <button 
                type="button" 
                (click)="showEditorModal.set(false)" 
                class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-4 flex-1">
              <form [formGroup]="templateForm" class="space-y-4">
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Template Name</label>
                    <input 
                      type="text" 
                      formControlName="name"
                      placeholder="e.g. Account Created Welcome"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Notification Type (Event Key)</label>
                    <input 
                      type="text" 
                      formControlName="notificationType"
                      placeholder="e.g. account.created"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Email Subject Template</label>
                  <input 
                    type="text" 
                    formControlName="subjectTemplate"
                    [placeholder]="'Welcome {{user_name}}!'"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Default / Email Body Template</label>
                  <textarea 
                    rows="3"
                    formControlName="bodyTemplate"
                    [placeholder]="'Hello {{user_name}}, your account {{account_name}} is ready.'"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"></textarea>
                </div>

                <!-- Channel Specific Variants -->
                <div class="space-y-3 pt-2 border-t border-slate-800">
                  <h4 class="text-xs font-semibold text-indigo-400">Channel Specific Overrides</h4>
                  
                  <div>
                    <label class="block text-[11px] font-mono text-slate-400 mb-1">SMS Variant (Keep brief under 160 chars)</label>
                    <input 
                      type="text" 
                      formControlName="smsVariant"
                      [placeholder]="'NotifyX: Hi {{user_name}}, your account is ready.'"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                  </div>

                  <div>
                    <label class="block text-[11px] font-mono text-slate-400 mb-1">Push Notification Variant</label>
                    <input 
                      type="text" 
                      formControlName="pushVariant"
                      [placeholder]="'Welcome {{user_name}}! Tap to open.'"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                  </div>

                  <div>
                    <label class="block text-[11px] font-mono text-slate-400 mb-1">In-App Notification Variant</label>
                    <input 
                      type="text" 
                      formControlName="inAppVariant"
                      [placeholder]="'Your {{account_name}} workspace has been created.'"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Required Variables (Comma separated)</label>
                  <input 
                    type="text" 
                    formControlName="variablesInput"
                    placeholder="user_name, account_name"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                </div>

              </form>
            </div>

            <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button 
                type="button" 
                (click)="showEditorModal.set(false)" 
                class="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer">
                Cancel
              </button>

              <button 
                type="button" 
                (click)="saveTemplate()"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer">
                Save Template
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Live Test Render / Interpolation Preview Modal -->
      @if (showPreviewModal() && previewingTemplate()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div class="flex items-center gap-2">
                <mat-icon class="text-indigo-400 text-base">visibility</mat-icon>
                <h3 class="text-sm font-semibold text-white tracking-tight">
                  Live Variable Interpolator: {{ previewingTemplate()!.name }}
                </h3>
              </div>
              <button 
                type="button" 
                (click)="showPreviewModal.set(false)" 
                class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-5 flex-1">
              
              <!-- Variable Inputs -->
              <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span class="text-xs font-semibold text-indigo-400 block font-mono">Test Variable Bindings</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for (v of previewingTemplate()!.requiredVariables; track v) {
                    <div>
                      <label class="block text-[11px] font-mono text-slate-300 mb-1">{{ formatTag(v) }}</label>
                      <input 
                        type="text" 
                        [value]="testVariables()[v] || ''"
                        (input)="updateTestVar(v, $any($event.target).value)"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                    </div>
                  }
                </div>
              </div>

              <!-- Multi-Channel Render Result Tabs -->
              <div class="space-y-3">
                <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Multi-Channel Rendered Previews
                </h4>

                <!-- Email Preview -->
                <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                    <mat-icon class="text-sm">email</mat-icon> Email Channel
                  </div>
                  <p class="text-xs font-medium text-slate-200">
                    <span class="text-slate-500">Subject:</span> {{ renderedResult()?.subject }}
                  </p>
                  <p class="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed pt-1">
                    {{ renderedResult()?.body }}
                  </p>
                </div>

                <!-- SMS Preview -->
                <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <mat-icon class="text-sm">sms</mat-icon> SMS Channel (160 GSM standard)
                  </div>
                  <p class="text-xs text-slate-300 font-mono">
                    {{ renderedResult()?.variants?.SMS || renderedResult()?.body }}
                  </p>
                </div>

                <!-- Push Preview -->
                <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <mat-icon class="text-sm">notifications_active</mat-icon> Push Notification (FCM Payload)
                  </div>
                  <p class="text-xs text-slate-300 font-mono">
                    {{ renderedResult()?.variants?.PUSH || renderedResult()?.body }}
                  </p>
                </div>

                <!-- In-App Preview -->
                <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                    <mat-icon class="text-sm">inbox</mat-icon> In-App Message
                  </div>
                  <p class="text-xs text-slate-300 font-mono">
                    {{ renderedResult()?.variants?.IN_APP || renderedResult()?.body }}
                  </p>
                </div>

              </div>

            </div>

            <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button 
                type="button" 
                (click)="showPreviewModal.set(false)" 
                class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer">
                Close Preview
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class TemplatesManager {
  private api = inject(Api);
  private toast = inject(Toast);

  formatTag(v: string): string {
    return '{{ ' + v + ' }}';
  }

  public templates = signal<Template[]>([]);
  public showEditorModal = signal<boolean>(false);
  public showPreviewModal = signal<boolean>(false);
  public editingTemplate = signal<Template | null>(null);
  public previewingTemplate = signal<Template | null>(null);
  public testVariables = signal<Record<string, string>>({});
  public renderedResult = signal<any>(null);

  public templateForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    notificationType: new FormControl('', [Validators.required]),
    subjectTemplate: new FormControl(''),
    bodyTemplate: new FormControl('', [Validators.required]),
    smsVariant: new FormControl(''),
    pushVariant: new FormControl(''),
    inAppVariant: new FormControl(''),
    variablesInput: new FormControl('user_name, account_name'),
  });

  constructor() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.api.getTemplates().subscribe({
      next: (res) => this.templates.set(res.data),
      error: (err) => this.toast.error('Load Failed', err.message)
    });
  }

  openCreateModal() {
    this.editingTemplate.set(null);
    this.templateForm.reset({
      name: '',
      notificationType: '',
      subjectTemplate: '',
      bodyTemplate: '',
      smsVariant: '',
      pushVariant: '',
      inAppVariant: '',
      variablesInput: 'user_name, account_name'
    });
    this.showEditorModal.set(true);
  }

  openEditModal(tpl: Template) {
    this.editingTemplate.set(tpl);
    this.templateForm.patchValue({
      name: tpl.name,
      notificationType: tpl.notificationType,
      subjectTemplate: tpl.subjectTemplate,
      bodyTemplate: tpl.bodyTemplate,
      smsVariant: tpl.channelVariants.SMS || '',
      pushVariant: tpl.channelVariants.PUSH || '',
      inAppVariant: tpl.channelVariants.IN_APP || '',
      variablesInput: tpl.requiredVariables.join(', ')
    });
    this.showEditorModal.set(true);
  }

  saveTemplate() {
    if (this.templateForm.invalid) {
      this.toast.error('Validation Error', 'Template name, event type and body are required.');
      return;
    }

    const val = this.templateForm.value;
    const reqVars = (val.variablesInput || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const payload: Partial<Template> = {
      name: val.name!,
      notificationType: val.notificationType!,
      channel: 'MULTI_CHANNEL',
      subjectTemplate: val.subjectTemplate || '',
      bodyTemplate: val.bodyTemplate!,
      channelVariants: {
        SMS: val.smsVariant || undefined,
        PUSH: val.pushVariant || undefined,
        IN_APP: val.inAppVariant || undefined,
      },
      requiredVariables: reqVars
    };

    if (this.editingTemplate()) {
      this.api.updateTemplate(this.editingTemplate()!.id, payload).subscribe({
        next: () => {
          this.toast.success('Updated', 'Template updated successfully.');
          this.showEditorModal.set(false);
          this.loadTemplates();
        },
        error: (err) => this.toast.error('Update Failed', err.message)
      });
    } else {
      this.api.createTemplate(payload).subscribe({
        next: () => {
          this.toast.success('Created', 'New template successfully created.');
          this.showEditorModal.set(false);
          this.loadTemplates();
        },
        error: (err) => this.toast.error('Create Failed', err.message)
      });
    }
  }

  deleteTemplate(id: string) {
    this.api.deleteTemplate(id).subscribe({
      next: () => {
        this.toast.info('Removed', 'Template deleted.');
        this.loadTemplates();
      },
      error: (err) => this.toast.error('Delete Failed', err.message)
    });
  }

  openPreviewModal(tpl: Template) {
    this.previewingTemplate.set(tpl);
    const initialVars: Record<string, string> = {};
    for (const v of tpl.requiredVariables) {
      if (v === 'user_name') initialVars[v] = 'Ahmed Mohamed';
      else if (v === 'account_name') initialVars[v] = 'NotifyX Global';
      else if (v === 'otp_code') initialVars[v] = '492019';
      else if (v === 'expiry_minutes') initialVars[v] = '10';
      else initialVars[v] = `test_${v}`;
    }
    this.testVariables.set(initialVars);
    this.refreshPreview(tpl.id, initialVars);
    this.showPreviewModal.set(true);
  }

  updateTestVar(k: string, v: string) {
    const next = { ...this.testVariables(), [k]: v };
    this.testVariables.set(next);
    if (this.previewingTemplate()) {
      this.refreshPreview(this.previewingTemplate()!.id, next);
    }
  }

  refreshPreview(id: string, vars: Record<string, string>) {
    this.api.renderTemplatePreview(id, vars).subscribe({
      next: (res) => this.renderedResult.set(res.rendered),
      error: (err) => {
        const msg = err.error?.error?.message || err.message;
        this.toast.warning('Variable Warning', msg);
      }
    });
  }
}
