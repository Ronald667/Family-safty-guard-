import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {SafetyService} from '../services/safety.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-calculator',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 max-w-md mx-auto select-none">
      <!-- Top Fake App Bar -->
      <div class="flex justify-between items-center py-2 border-b border-slate-800">
        <div class="flex items-center space-x-2">
          <mat-icon class="text-amber-400">calculate</mat-icon>
          <span class="font-semibold text-slate-200">Standard Calculator</span>
        </div>
        <button 
          (click)="safety.toggleDisguise()"
          class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-rose-300 font-medium transition flex items-center space-x-1">
          <mat-icon class="text-xs">lock_open</mat-icon>
          <span>Exit Disguise</span>
        </button>
      </div>

      <!-- Display Screen -->
      <div class="my-auto bg-slate-950 p-6 rounded-2xl border border-slate-800 text-right shadow-inner">
        <div class="text-slate-500 text-sm h-6 overflow-hidden">{{ historyDisplay() }}</div>
        <div class="text-4xl font-light tracking-wider text-white mt-1 overflow-x-auto">{{ display() }}</div>
      </div>

      <!-- Keypad -->
      <div class="grid grid-cols-4 gap-3 mb-6">
        @for (btn of buttons; track btn) {
          <button 
            (click)="onButtonPress(btn)"
            class="h-16 rounded-2xl flex items-center justify-center text-xl font-medium transition active:scale-95 shadow-sm"
            [class.bg-slate-800]="!isNumeric(btn) && btn !== '='"
            [class.bg-emerald-600]="btn === '='"
            [class.text-white]="true"
            [class.bg-slate-800/80]="isNumeric(btn)">
            {{ btn }}
          </button>
        }
      </div>

      <div class="text-center text-xs text-slate-500 pb-2">
        Tip: Enter <span class="text-amber-400 font-mono">7894=</span> or tap Exit Disguise to return to SafeHaven.
      </div>
    </div>
  `,
  styles: ``
})
export class Calculator {
  safety = inject(SafetyService);
  display = signal<string>('0');
  historyDisplay = signal<string>('');
  private currentInput = '';

  buttons = [
    'C', '(', ')', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '⌫', '='
  ];

  isNumeric(val: string): boolean {
    return !isNaN(Number(val));
  }

  onButtonPress(btn: string) {
    if (btn === 'C') {
      this.display.set('0');
      this.historyDisplay.set('');
      this.currentInput = '';
    } else if (btn === '⌫') {
      this.currentInput = this.currentInput.slice(0, -1);
      this.display.set(this.currentInput || '0');
    } else if (btn === '=') {
      if (this.currentInput === '7894' || this.currentInput === '1234') {
        this.safety.disguiseMode.set(false);
        this.safety.isLocked.set(false);
        return;
      }
      try {
        const sanitized = this.currentInput.replace(/×/g, '*').replace(/÷/g, '/');
        // Simple safe arithmetic evaluation
        const res = Function('"use strict";return (' + sanitized + ')')();
        this.historyDisplay.set(this.currentInput + ' =');
        this.display.set(String(res));
        this.currentInput = String(res);
      } catch {
        this.display.set('Error');
        this.currentInput = '';
      }
    } else {
      if (this.display() === '0' && !['+', '-', '*', '/'].includes(btn)) {
        this.currentInput = btn;
      } else {
        this.currentInput += btn;
      }
      this.display.set(this.currentInput);
    }
  }
}
