import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {SafetyService} from '../services/safety.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-biometric-modal',
  imports: [CommonModule, MatIconModule],
  template: `
    @if (safety.biometricPromptActive()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center relative">
          
          <button 
            type="button"
            (click)="confirmBiometric()"
            class="w-20 h-20 rounded-full bg-rose-600/10 border border-rose-500/30 flex items-center justify-center mb-4 relative cursor-pointer group">
            <mat-icon class="text-rose-500 text-4xl group-hover:scale-110 transition duration-300">fingerprint</mat-icon>
            <div class="absolute inset-0 rounded-full border border-rose-500/50 animate-ping pointer-events-none"></div>
          </button>

          <div class="flex items-center space-x-1.5 text-xs text-rose-400 font-semibold mb-1">
            <mat-icon class="text-xs">security</mat-icon>
            <span>WebAuthn Biometric Authentication</span>
          </div>

          <h3 class="text-xl font-bold text-white mb-2">Verify Your Identity</h3>
          <p class="text-slate-400 text-xs mb-6 leading-relaxed">{{ safety.biometricReason() }}</p>

          <div class="w-full space-y-3">
            <button 
              (click)="confirmBiometric()"
              class="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2">
              <mat-icon class="text-sm">verified_user</mat-icon>
              <span>Scan Fingerprint / FaceID</span>
            </button>
            <button 
              (click)="cancelBiometric()"
              class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition">
              Cancel
            </button>
          </div>

          <p class="text-[10px] text-slate-500 mt-4">Secured by WebAuthn Platform Authenticator API</p>
        </div>
      </div>
    }
  `,
  styles: ``
})
export class BiometricModal {
  safety = inject(SafetyService);

  confirmBiometric() {
    this.safety.resolveBiometric(true);
  }

  cancelBiometric() {
    this.safety.resolveBiometric(false);
  }
}
