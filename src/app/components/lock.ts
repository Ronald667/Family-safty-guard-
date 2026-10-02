import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {SafetyService} from '../services/safety.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lock',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 relative overflow-hidden">
      <!-- Background Glow Effects -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Top Bar with Quick Disguise -->
      <div class="flex justify-between items-center z-10">
        <div class="flex items-center space-x-2">
          <div class="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/30">
            <mat-icon class="text-white">shield</mat-icon>
          </div>
          <span class="font-bold text-xl tracking-wide bg-gradient-to-r from-white via-slate-200 to-rose-300 bg-clip-text text-transparent">SafeHaven</span>
        </div>
        <button 
          (click)="safety.toggleDisguise()"
          class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
          <mat-icon class="text-xs text-amber-400">calculate</mat-icon>
          <span>Disguise Mode</span>
        </button>
      </div>

      <!-- Center Lock Pad -->
      <div class="flex flex-col items-center justify-center my-auto z-10 max-w-sm mx-auto w-full">
        <button 
          type="button"
          (click)="simulateBiometric()"
          class="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-xl relative group cursor-pointer">
            <mat-icon class="text-rose-500 text-3xl group-hover:scale-110 transition duration-300">fingerprint</mat-icon>
            <div class="absolute inset-0 rounded-full border border-rose-500/30 animate-ping pointer-events-none"></div>
        </button>

        <h2 class="text-2xl font-bold tracking-tight mb-2">Secure Access Vault</h2>
        <p class="text-slate-400 text-sm text-center mb-8">Enter your 4-digit PIN or use biometric scan to access encrypted reports & emergency controls.</p>

        <!-- PIN Dots -->
        <div class="flex space-x-4 mb-8">
          @for (dot of [0, 1, 2, 3]; track dot) {
            <div class="w-4 h-4 rounded-full transition-all duration-300"
                 [class.bg-rose-500]="pin().length > dot"
                 [class.shadow-md]="pin().length > dot"
                 [class.shadow-rose-500/50]="pin().length > dot"
                 [class.bg-slate-800]="pin().length <= dot">
            </div>
          }
        </div>

        @if (errorMessage()) {
          <p class="text-rose-400 text-xs mb-4 animate-bounce">{{ errorMessage() }}</p>
        }

        <!-- Keypad -->
        <div class="grid grid-cols-3 gap-4 w-full max-w-xs">
          @for (num of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫']; track num) {
            <button 
              (click)="handleKey(num)"
              class="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-lg font-semibold text-slate-200 hover:text-white transition active:scale-95 shadow-sm">
              @if (num === '⌫') {
                <mat-icon>backspace</mat-icon>
              } @else if (num === 'C') {
                <span class="text-xs text-rose-400 font-bold">CLEAR</span>
              } @else {
                {{ num }}
              }
            </button>
          }
        </div>
      </div>

      <!-- Footer Help Notice -->
      <div class="text-center z-10 text-xs text-slate-500 flex flex-col items-center space-y-1">
        <p>End-to-End Encrypted • Zero-Knowledge Architecture</p>
        <p class="text-rose-400/80">In immediate danger? Press the emergency hotline in resources.</p>
      </div>
    </div>
  `,
  styles: ``
})
export class Lock {
  safety = inject(SafetyService);
  pin = signal<string>('');
  errorMessage = signal<string>('');

  handleKey(val: string) {
    if (val === 'C') {
      this.pin.set('');
      this.errorMessage.set('');
    } else if (val === '⌫') {
      this.pin.update(p => p.slice(0, -1));
      this.errorMessage.set('');
    } else {
      if (this.pin().length < 4) {
        this.pin.update(p => p + val);
        if (this.pin().length === 4) {
          const success = this.safety.unlock(this.pin());
          if (!success) {
            this.errorMessage.set('Incorrect PIN. Try 1234 or 0000.');
            setTimeout(() => this.pin.set(''), 800);
          }
        }
      }
    }
  }

  simulateBiometric() {
    // Instant success on biometric scan
    this.safety.unlock('1234');
  }
}
