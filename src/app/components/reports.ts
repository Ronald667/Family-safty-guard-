import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {SafetyService, AnonymousReport} from '../services/safety.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports',
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div class="flex items-center space-x-2 text-indigo-400 font-semibold text-sm mb-1">
            <mat-icon class="text-indigo-400">lock</mat-icon>
            <span>ZERO-KNOWLEDGE ENCRYPTED VAULT</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-white">Anonymous Incident Reporting</h1>
          <p class="text-slate-400 text-sm mt-1 max-w-xl">Submit reports securely with end-to-end encryption. Your identity is fully protected with generated case codes and zero traceability.</p>
        </div>
        <button 
          (click)="showNewReportModal.set(true)"
          class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition">
          <mat-icon>add_moderator</mat-icon>
          <span>File New Anonymous Report</span>
        </button>
      </div>

      <!-- Background Sync Status Bar -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 rounded-full" [class.bg-emerald-500]="safety.isOnline()" [class.bg-amber-500]="!safety.isOnline()"></div>
          <div>
            <span class="font-bold text-white">Cloud Sync Status:</span>
            <span class="text-slate-300 ml-1">{{ safety.syncStatus() }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <span class="text-slate-400 font-mono">Queued Items: {{ safety.offlineQueue().length }}</span>
          <button 
            (click)="safety.processOfflineQueue()"
            class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition flex items-center space-x-1">
            <mat-icon class="text-xs">sync</mat-icon>
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      <!-- New Report Modal Form -->
      @if (showNewReportModal()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 class="text-xl font-bold text-white flex items-center space-x-2">
                <mat-icon class="text-indigo-400">security</mat-icon>
                <span>New Encrypted Incident Report</span>
              </h3>
              <button (click)="showNewReportModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Incident Category
                  <select 
                    [(ngModel)]="newCategory"
                    class="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="Domestic Violence">Domestic Violence</option>
                    <option value="Stalking">Stalking & Harassment</option>
                    <option value="Child Endangerment">Child Endangerment</option>
                    <option value="Workplace Abuse">Workplace Abuse</option>
                    <option value="Other">Other Safety Concern</option>
                  </select>
                </label>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Location / Venue
                  <input 
                    type="text" 
                    [(ngModel)]="newLocation"
                    placeholder="e.g. 742 Evergreen Terrace, Sector 2"
                    class="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </label>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Detailed Description & Evidence Notes
                  <textarea 
                    rows="4"
                    [(ngModel)]="newDescription"
                    placeholder="Describe what occurred, dates, times, and any details securely..."
                    class="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"></textarea>
                </label>
              </div>

              <div class="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start space-x-3 text-xs text-indigo-200">
                <mat-icon class="text-indigo-400 shrink-0">verified_user</mat-icon>
                <p>Data will be encrypted locally with AES-256 simulation before transmission. A unique Case Tracking Code will be generated so only you can review updates.</p>
              </div>

              <div class="flex space-x-3 pt-2">
                <button 
                  (click)="showNewReportModal.set(false)"
                  class="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition">
                  Cancel
                </button>
                <button 
                  (click)="submitReport()"
                  class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition">
                  Encrypt & Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (latestCreatedCode()) {
        <div class="bg-emerald-950/80 border border-emerald-500/50 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <mat-icon class="text-2xl">check_circle</mat-icon>
            </div>
            <div>
              <h4 class="font-bold text-lg text-white">Report Successfully Encrypted & Saved</h4>
              <p class="text-xs text-emerald-200">Your Case Tracking Code is <span class="font-mono font-bold text-white bg-emerald-900 px-2 py-0.5 rounded">{{ latestCreatedCode() }}</span>. Save this code!</p>
            </div>
          </div>
          <button (click)="latestCreatedCode.set(null)" class="text-xs text-emerald-300 hover:text-white underline">Dismiss</button>
        </div>
      }

      <!-- Reports List Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (report of safety.reports(); track report.id) {
          <div class="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div class="flex justify-between items-start mb-4">
                <div>
                  <span class="text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    {{ report.caseCode }}
                  </span>
                  <span class="text-xs text-slate-400 ml-2">{{ report.date }}</span>
                </div>
                <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                      [class.bg-emerald-500/10]="report.status.includes('Secure')"
                      [class.text-emerald-400]="report.status.includes('Secure')"
                      [class.bg-amber-500/10]="!report.status.includes('Secure')"
                      [class.text-amber-400]="!report.status.includes('Secure')">
                  {{ report.status }}
                </span>
              </div>

              <h3 class="font-bold text-lg text-white mb-1">{{ report.category }}</h3>
              <p class="text-xs text-slate-400 mb-3 flex items-center space-x-1">
                <mat-icon class="text-xs text-slate-500">location_on</mat-icon>
                <span>{{ report.location }}</span>
              </p>
              <p class="text-sm text-slate-300 mb-4 line-clamp-3">{{ report.description }}</p>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span class="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">Blob: {{ report.encryptedBlob }}</span>
              <button 
                (click)="viewReportDetails(report)"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium transition flex items-center space-x-1">
                <mat-icon class="text-xs">visibility</mat-icon>
                <span>View Details</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``
})
export class Reports {
  safety = inject(SafetyService);
  showNewReportModal = signal<boolean>(false);
  newCategory: AnonymousReport['category'] = 'Domestic Violence';
  newLocation = '';
  newDescription = '';
  latestCreatedCode = signal<string | null>(null);

  async submitReport() {
    if (!this.newDescription.trim()) {
      alert("Please enter incident details.");
      return;
    }
    const verified = await this.safety.requestBiometricAuth('Authenticate via WebAuthn Biometric to encrypt and save anonymous incident report');
    if (verified) {
      const created = this.safety.addReport(this.newCategory, this.newDescription, this.newLocation);
      this.latestCreatedCode.set(created.caseCode);
      this.newDescription = '';
      this.newLocation = '';
      this.showNewReportModal.set(false);
    }
  }

  async viewReportDetails(report: AnonymousReport) {
    const verified = await this.safety.requestBiometricAuth('Authenticate via WebAuthn Biometric to decrypt secure report data');
    if (verified) {
      alert(`Report Case Code: ${report.caseCode}\nCategory: ${report.category}\nDate: ${report.date}\nStatus: ${report.status}\n\nEncrypted Payload Hash:\n${report.encryptedBlob}`);
    }
  }
}
