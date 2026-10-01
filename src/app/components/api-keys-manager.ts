import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api } from '../services/api';
import { Toast } from '../services/toast';
import { ApiKeyItem } from '../models/notifyx';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-api-keys-manager',
  imports: [MatIconModule, DatePipe, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>API Clients & Integration Keys</span>
            <span class="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              SHA-256 Hashed
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Issue cryptographically secure tokens with scoped permissions and rate limits for external microservices.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
          <mat-icon class="text-sm">add</mat-icon>
          <span>Generate API Key</span>
        </button>
      </div>

      <!-- Keys Table -->
      <div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-sm">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <mat-icon class="text-sm text-indigo-400">vpn_key</mat-icon> Active Integration Keys
          </h3>
          <span class="text-[11px] font-mono text-slate-500">{{ keys().length }} Registered</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono uppercase text-slate-500">
                <th class="p-3.5">Name / Prefix</th>
                <th class="p-3.5">Masked Secret</th>
                <th class="p-3.5">Granted Scopes</th>
                <th class="p-3.5">Rate Limit</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5">Last Used</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              @for (k of keys(); track k.id) {
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3.5">
                    <p class="font-sans font-semibold text-slate-200">{{ k.name }}</p>
                    <p class="text-[11px] text-slate-500 font-mono">{{ k.keyPrefix }}</p>
                  </td>

                  <td class="p-3.5 text-slate-300">{{ k.maskedSecret }}</td>

                  <td class="p-3.5">
                    <div class="flex flex-wrap gap-1">
                      @for (s of k.scopes; track s) {
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {{ s }}
                        </span>
                      }
                    </div>
                  </td>

                  <td class="p-3.5 text-slate-400">{{ k.rateLimitPerMinute }} req/m</td>

                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-semibold"
                      [class]="!k.isRevoked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'">
                      {{ !k.isRevoked ? 'Active' : 'Revoked' }}
                    </span>
                  </td>

                  <td class="p-3.5 text-slate-400 font-mono">
                    {{ k.lastUsedAt ? (k.lastUsedAt | date:'shortTime') : 'Never' }}
                  </td>

                  <td class="p-3.5 text-right">
                    @if (!k.isRevoked) {
                      <button
                        type="button"
                        (click)="revokeKey(k.id)"
                        class="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer">
                        Revoke
                      </button>
                    } @else {
                      <span class="text-slate-600 text-xs">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Developer Quickstart & Code Generator -->
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <mat-icon class="text-sm text-indigo-400">code</mat-icon> External SDK & REST API Integration
          </h3>

          <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              (click)="activeCodeTab.set('curl')"
              class="px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer"
              [class]="activeCodeTab() === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'">
              cURL
            </button>
            <button
              type="button"
              (click)="activeCodeTab.set('node')"
              class="px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer"
              [class]="activeCodeTab() === 'node' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'">
              Node.js
            </button>
            <button
              type="button"
              (click)="activeCodeTab.set('python')"
              class="px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer"
              [class]="activeCodeTab() === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'">
              Python
            </button>
          </div>
        </div>

        <div class="relative">
          @if (activeCodeTab() === 'curl') {
            <pre class="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
curl -X POST https://api.notifyx.io/api/v1/notifications/send/ \\
  -H "Authorization: Bearer nx_live_fin98_entropy..." \\
  -H "Idempotency-Key: b7f14e28-1f63-4702" \\
  -H "Content-Type: application/json" \\
  -d '&#123;
    "event": "account.created",
    "recipient": "ahmedlibanmohamed89@gmail.com",
    "channels": ["EMAIL", "PUSH", "IN_APP"],
    "priority": "HIGH",
    "data": &#123;
      "user_name": "Ahmed Mohamed",
      "account_name": "Acme Global FinTech"
    &#125;
  &#125;'</pre>
          } @else if (activeCodeTab() === 'node') {
            <pre class="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
import &#123; NotifyX &#125; from '&#64;notifyx/sdk';

const notifyx = new NotifyX(&#123; apiKey: process.env.NOTIFYX_API_KEY &#125;);

const response = await notifyx.notifications.send(&#123;
  event: 'account.created',
  recipient: 'ahmedlibanmohamed89&#64;gmail.com',
  channels: ['EMAIL', 'PUSH'],
  data: &#123;
    user_name: 'Ahmed Mohamed',
    account_name: 'NotifyX Enterprise'
  &#125;
&#125;);
console.log('Dispatched tasks:', response.notifications);</pre>
          } @else {
            <pre class="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
import requests

response = requests.post(
    "https://api.notifyx.io/api/v1/notifications/send/",
    headers=&#123;
        "Authorization": f"Bearer &#123;API_KEY&#125;",
        "Content-Type": "application/json"
    &#125;,
    json=&#123;
        "event": "account.created",
        "recipient": "ahmedlibanmohamed89&#64;gmail.com",
        "channels": ["EMAIL", "SMS"],
        "data": &#123;"user_name": "Ahmed", "account_name": "NotifyX"&#125;
    &#125;
)
print("Response:", response.json())</pre>
          }
        </div>
      </div>

      <!-- Generate Key Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 class="text-sm font-semibold text-white tracking-tight">Generate New Integration Key</h3>
              <button (click)="showCreateModal.set(false)" class="text-slate-400 hover:text-white p-1 cursor-pointer">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <div class="p-6 space-y-4">
              <form [formGroup]="keyForm" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Key Name / Description</label>
                  <input 
                    type="text" 
                    formControlName="name"
                    placeholder="e.g. Billing Service Ingestion Key"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Rate Limit per Minute</label>
                  <input 
                    type="number" 
                    formControlName="rateLimit"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono">
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Permitted Scopes</label>
                  <div class="space-y-1.5 pt-1">
                    <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked disabled class="rounded bg-slate-800 border-slate-700 text-indigo-600">
                      <span class="font-mono text-[11px]">notifications.send (Dispatch notifications)</span>
                    </label>
                    <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked disabled class="rounded bg-slate-800 border-slate-700 text-indigo-600">
                      <span class="font-mono text-[11px]">notifications.read (Track status & logs)</span>
                    </label>
                    <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked class="rounded bg-slate-800 border-slate-700 text-indigo-600">
                      <span class="font-mono text-[11px]">templates.read (Retrieve templates)</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button 
                type="button" 
                (click)="showCreateModal.set(false)" 
                class="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer">
                Cancel
              </button>

              <button 
                type="button" 
                (click)="createKey()"
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer">
                Generate Token
              </button>
            </div>

          </div>
        </div>
      }

      <!-- One-time Plaintext Secret Reveal Modal -->
      @if (revealedSecret()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div class="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            <div class="p-6 space-y-4">
              <div class="flex items-center gap-3 text-emerald-400">
                <mat-icon class="text-2xl">verified_user</mat-icon>
                <h3 class="text-base font-bold text-white tracking-tight">API Key Generated Successfully</h3>
              </div>

              <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-1">
                <p class="font-semibold flex items-center gap-1.5">
                  <mat-icon class="text-sm">warning</mat-icon> Store this secret key now!
                </p>
                <p class="text-[11px] leading-relaxed">
                  For security, this secret token is only shown once and is never stored in plaintext on NotifyX servers.
                </p>
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-mono text-slate-400 uppercase">Plaintext Secret Key:</label>
                <div class="flex items-center gap-2">
                  <input 
                    type="text" 
                    readonly 
                    [value]="revealedSecret()"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono select-all focus:outline-none">
                  <button
                    type="button"
                    (click)="copySecret()"
                    class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer shrink-0">
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button 
                type="button" 
                (click)="revealedSecret.set(null)" 
                class="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer">
                I Have Saved My Key
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class ApiKeysManager {
  private api = inject(Api);
  private toast = inject(Toast);

  public keys = signal<ApiKeyItem[]>([]);
  public showCreateModal = signal<boolean>(false);
  public revealedSecret = signal<string | null>(null);
  public activeCodeTab = signal<'curl' | 'node' | 'python'>('curl');

  public keyForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    rateLimit: new FormControl(1000, [Validators.required]),
  });

  constructor() {
    this.loadKeys();
  }

  loadKeys() {
    this.api.getApiKeys().subscribe({
      next: (res) => this.keys.set(res.data),
      error: (err) => this.toast.error('Load Failed', err.message)
    });
  }

  openCreateModal() {
    this.keyForm.reset({ name: '', rateLimit: 1000 });
    this.showCreateModal.set(true);
  }

  createKey() {
    if (this.keyForm.invalid) {
      this.toast.error('Validation Error', 'API key name is required.');
      return;
    }

    const val = this.keyForm.value;
    this.api.createApiKey({
      name: val.name!,
      scopes: ['notifications.send', 'notifications.read', 'templates.read'],
      rateLimitPerMinute: val.rateLimit || 1000,
    }).subscribe({
      next: (res) => {
        this.showCreateModal.set(false);
        this.revealedSecret.set(res.plaintextSecretKey);
        this.loadKeys();
      },
      error: (err) => this.toast.error('Generation Failed', err.message)
    });
  }

  revokeKey(id: string) {
    this.api.revokeApiKey(id).subscribe({
      next: (res) => {
        this.toast.info('Revoked', res.message);
        this.loadKeys();
      },
      error: (err) => this.toast.error('Revoke Failed', err.message)
    });
  }

  copySecret() {
    if (this.revealedSecret()) {
      navigator.clipboard.writeText(this.revealedSecret()!);
      this.toast.success('Copied', 'API key copied to clipboard.');
    }
  }
}
