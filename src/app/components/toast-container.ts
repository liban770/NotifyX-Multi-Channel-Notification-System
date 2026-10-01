import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast } from '../services/toast';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast-container',
  imports: [MatIconModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0"
          [class]="toast.type === 'success' ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-100 shadow-emerald-950/20' :
                   toast.type === 'error' ? 'bg-slate-900/95 border-rose-500/30 text-rose-100 shadow-rose-950/20' :
                   toast.type === 'warning' ? 'bg-slate-900/95 border-amber-500/30 text-amber-100 shadow-amber-950/20' :
                   'bg-slate-900/95 border-indigo-500/30 text-indigo-100 shadow-indigo-950/20'">
          
          <div class="mt-0.5 shrink-0">
            @if (toast.type === 'success') {
              <mat-icon class="text-emerald-400 text-xl">check_circle</mat-icon>
            } @else if (toast.type === 'error') {
              <mat-icon class="text-rose-400 text-xl">error</mat-icon>
            } @else if (toast.type === 'warning') {
              <mat-icon class="text-amber-400 text-xl">warning</mat-icon>
            } @else {
              <mat-icon class="text-indigo-400 text-xl">info</mat-icon>
            }
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold tracking-tight text-white">{{ toast.title }}</h4>
            <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">{{ toast.message }}</p>
          </div>

          <button 
            type="button"
            (click)="toastService.dismiss(toast.id)"
            class="text-slate-400 hover:text-white p-1 rounded transition-colors -mr-1 -mt-1 cursor-pointer">
            <mat-icon class="text-sm leading-none">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainer {
  public toastService = inject(Toast);
}
