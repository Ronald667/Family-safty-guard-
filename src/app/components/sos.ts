import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {SafetyService} from '../services/safety.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sos',
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Top Emergency Header -->
      <div class="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 p-6 rounded-2xl border border-rose-500/30 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div class="flex items-center space-x-2 text-rose-400 font-semibold text-sm mb-1">
            <mat-icon class="text-rose-500 animate-pulse">emergency</mat-icon>
            <span>IMMEDIATE PANIC BUTTON & GPS DISPATCH</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-white">Emergency SOS & Panic Center</h1>
          <p class="text-slate-400 text-sm mt-1 max-w-xl">Instant GPS broadcasting, pre-defined emergency message queue, and anti-uninstall protection for absolute victim security.</p>
        </div>
        <button 
          (click)="triggerFakeCall()"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm flex items-center space-x-2 shadow-sm transition">
          <mat-icon class="text-emerald-400">phone_in_talk</mat-icon>
          <span>Simulate Safe Exit Call</span>
        </button>
      </div>

      @if (fakeCallActive()) {
        <div class="bg-slate-900 border border-emerald-500/50 p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-fade-in">
          <div class="w-20 h-20 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
            <mat-icon class="text-4xl">phone</mat-icon>
          </div>
          <h3 class="text-xl font-bold">Incoming Call: Mom / Friend</h3>
          <p class="text-slate-400 text-sm mb-6">Ring in progress... Use this to excuse yourself from a dangerous situation.</p>
          <div class="flex space-x-4">
            <button (click)="endFakeCall()" class="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-lg transition">
              End Call
            </button>
            <button (click)="answerFakeCall()" class="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-lg transition">
              Accept & Speak
            </button>
          </div>
        </div>
      }

      <!-- Main SOS Button Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- SOS Panic Button Card -->
        <div class="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          @if (sosActiveCountdown > 0) {
            <div class="absolute inset-0 bg-rose-950/95 z-20 flex flex-col items-center justify-center p-6 animate-pulse">
              <h2 class="text-3xl font-extrabold text-white mb-2">SENDING SOS IN {{ sosActiveCountdown }}s</h2>
              <p class="text-rose-200 text-sm mb-8">Broadcasting GPS coordinates & SMS emergency message to trusted contacts and authorities.</p>
              <button 
                (click)="cancelSos()"
                class="px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-200 shadow-2xl transition">
                CANCEL SOS (I am Safe)
              </button>
            </div>
          } @else if (safety.sosActive()) {
            <div class="absolute inset-0 bg-rose-900/95 z-20 flex flex-col items-center justify-center p-6">
              <div class="w-24 h-24 rounded-full bg-white text-rose-600 flex items-center justify-center mb-4 shadow-2xl animate-bounce">
                <mat-icon class="text-5xl">warning</mat-icon>
              </div>
              <h2 class="text-3xl font-extrabold text-white mb-2">PANIC BROADCAST ACTIVE</h2>
              <p class="text-rose-100 text-sm mb-4 max-w-md">Status: <span class="font-bold underline">{{ safety.broadcastStatus() }}</span></p>
              @if (safety.currentGpsLocation(); as loc) {
                <p class="text-xs text-rose-200 font-mono mb-6 bg-rose-950/80 px-4 py-2 rounded-xl border border-rose-500/30">
                  GPS: Lat {{ loc.lat.toFixed(4) }}, Lng {{ loc.lng.toFixed(4) }} (Accuracy ±{{ loc.accuracy }}m)
                </p>
              }
              <button 
                (click)="deactivateSos()"
                class="px-8 py-3 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-900 shadow-xl border border-rose-400 transition">
                Deactivate Panic Alert
              </button>
            </div>
          }

          <button 
            type="button"
            (click)="startSosCountdown()"
            class="w-52 h-52 rounded-full bg-gradient-to-br from-rose-600 via-rose-600 to-rose-700 flex items-center justify-center shadow-2xl shadow-rose-600/60 cursor-pointer hover:scale-105 active:scale-95 transition duration-300 relative group">
            <div class="absolute inset-2 rounded-full border-2 border-white/40 animate-ping pointer-events-none"></div>
            <div class="flex flex-col items-center text-white z-10 pointer-events-none">
              <mat-icon class="text-7xl mb-1 animate-bounce">crisis_alert</mat-icon>
              <span class="font-black text-3xl tracking-wider">PANIC SOS</span>
              <span class="text-xs text-rose-200 font-medium">Tap to Broadcast GPS</span>
            </div>
          </button>

          <p class="text-slate-400 text-sm mt-6">
            Emergency Hotlines: <span class="text-rose-400 font-semibold">911 (US) • 999 (UK) • 112 (EU) • 1-800-799-7233 (Hotline)</span>
          </p>

          <div class="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300 w-full max-w-md">
            <div class="flex items-center space-x-2">
              <mat-icon class="text-rose-400 text-sm">volume_down</mat-icon>
              <span>Hardware Volume Pattern: Press Volume Down 3x rapidly (works screen-off)</span>
            </div>
            <button 
              (click)="safety.handleVolumeDownPress()"
              class="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold transition shrink-0">
              Test Pattern
            </button>
          </div>

          <!-- Voice Recognition Panic Phrase Card -->
          <div class="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300 w-full max-w-md">
            <div class="flex items-center space-x-2.5">
              <mat-icon class="text-rose-400 text-sm" [class.animate-pulse]="safety.voiceRecognitionActive()">mic</mat-icon>
              <div>
                <span class="font-bold text-white block">Voice Recognition Panic Phrase</span>
                <span class="text-[11px] text-slate-400">Listens for: "<span class="text-rose-300 font-semibold">{{ safety.panicPhrase() }}</span>" or "Help"</span>
              </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold" [class.bg-emerald-500/20]="safety.voiceRecognitionActive()" [class.text-emerald-400]="safety.voiceRecognitionActive()" [class.bg-slate-800]="!safety.voiceRecognitionActive()" [class.text-slate-400]="!safety.voiceRecognitionActive()">
                {{ safety.voiceRecognitionActive() ? 'LISTENING ACTIVE' : 'OFF' }}
              </span>
              <button 
                (click)="safety.toggleVoiceRecognition()"
                class="px-3 py-1.5 rounded-lg text-white font-semibold transition shadow"
                [class.bg-rose-600]="!safety.voiceRecognitionActive()"
                [class.hover:bg-rose-700]="!safety.voiceRecognitionActive()"
                [class.bg-slate-800]="safety.voiceRecognitionActive()"
                [class.hover:bg-slate-700]="safety.voiceRecognitionActive()">
                {{ safety.voiceRecognitionActive() ? 'Stop Mic' : 'Start Listening' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Emergency Contacts & Status -->
        <div class="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-white flex items-center space-x-2">
                <mat-icon class="text-rose-400">group</mat-icon>
                <span>Trusted Contacts</span>
              </h3>
              <span class="text-xs bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full font-medium">Auto-Notify On</span>
            </div>
            
            <div class="space-y-3">
              @for (contact of safety.trustedContacts(); track contact.phone) {
                <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h4 class="font-semibold text-sm text-slate-200">{{ contact.name }}</h4>
                    <p class="text-xs text-slate-400">{{ contact.relation }} • {{ contact.phone }}</p>
                  </div>
                  <a [href]="'tel:' + contact.phone" class="w-9 h-9 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 flex items-center justify-center transition">
                    <mat-icon class="text-sm">call</mat-icon>
                  </a>
                </div>
              }
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <button 
              (click)="addContactPrompt()"
              class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center space-x-2 transition">
              <mat-icon class="text-sm">person_add</mat-icon>
              <span>Add Trusted Contact</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pre-defined Emergency Message & Anti-Uninstall Security Settings -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Emergency Message Customizer -->
        <div class="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div class="flex items-center space-x-2 text-rose-400 font-bold mb-2">
            <mat-icon>message</mat-icon>
            <span>Pre-Defined Emergency SMS Message</span>
          </div>
          <p class="text-xs text-slate-400 mb-4">This message is automatically appended with live GPS coordinates and sent when the Panic Button is triggered.</p>
          
          <textarea 
            rows="3"
            [(ngModel)]="editableMessage"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-rose-500 mb-3"></textarea>
          
          <button 
            (click)="saveEmergencyMessage()"
            class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-md">
            Save Emergency Message
          </button>
        </div>

        <!-- Anti-Uninstall Protection Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2 text-indigo-400 font-bold">
                <mat-icon>security</mat-icon>
                <span>Anti-Uninstall Protection</span>
              </div>
              <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500/10 text-indigo-400">
                Active & Secured
              </span>
            </div>
            <p class="text-xs text-slate-400 mb-4 leading-relaxed">
              Prevents unauthorized removal or data clearing by abusers. Uninstalling or removing SafeHaven requires the victim's secret unlock code.
            </p>
          </div>

          <button 
            (click)="promptUninstall()"
            class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 transition border border-slate-700">
            <mat-icon class="text-rose-400 text-sm">lock_person</mat-icon>
            <span>Test / Request Uninstall Authorization</span>
          </button>
        </div>
      </div>

      @if (safety.uninstallModalOpen()) {
        <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div class="w-16 h-16 rounded-full bg-rose-600/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-3xl">warning</mat-icon>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Uninstall Protection Locked</h3>
            <p class="text-xs text-slate-400 mb-6">Enter your secret uninstall code (Default: <span class="text-rose-400 font-mono">9988</span>) to authorize app removal.</p>
            
            <input 
              type="password"
              maxlength="6"
              [(ngModel)]="enteredUninstallCode"
              placeholder="Enter Secret Code"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-center tracking-widest font-mono text-lg focus:outline-none focus:border-rose-500 mb-4" />

            <div class="flex space-x-3">
              <button 
                (click)="safety.uninstallModalOpen.set(false)"
                class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">
                Cancel
              </button>
              <button 
                (click)="submitUninstallCode()"
                class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30">
                Authorize Removal
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: ``
})
export class Sos {
  safety = inject(SafetyService);
  sosActiveCountdown = 0;
  fakeCallActive = signal<boolean>(false);
  editableMessage = this.safety.emergencyMessage();
  enteredUninstallCode = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private countdownTimer: any;

  startSosCountdown() {
    if (this.sosActiveCountdown > 0 || this.safety.sosActive()) return;
    this.sosActiveCountdown = 3;
    this.countdownTimer = setInterval(() => {
      this.sosActiveCountdown--;
      if (this.sosActiveCountdown <= 0) {
        clearInterval(this.countdownTimer);
        this.safety.triggerPanicBroadcast();
      }
    }, 1000);
  }

  cancelSos() {
    clearInterval(this.countdownTimer);
    this.sosActiveCountdown = 0;
  }

  deactivateSos() {
    this.safety.sosActive.set(false);
    this.safety.broadcastStatus.set('Idle');
  }

  triggerFakeCall() {
    this.fakeCallActive.set(true);
  }

  endFakeCall() {
    this.fakeCallActive.set(false);
  }

  answerFakeCall() {
    alert("Call Connected. Speaking simulation: 'Hey! Where are you? I've been waiting for you for 10 minutes.'");
    this.fakeCallActive.set(false);
  }

  addContactPrompt() {
    const name = prompt("Enter contact name:");
    const phone = prompt("Enter contact phone number:");
    const relation = prompt("Enter relation (e.g. Sister, Friend, Advocate):");
    if (name && phone) {
      this.safety.addTrustedContact(name, phone, relation || 'Trusted Contact', true);
    }
  }

  saveEmergencyMessage() {
    if (this.editableMessage.trim()) {
      this.safety.updateEmergencyMessage(this.editableMessage);
      alert("Pre-defined emergency message updated successfully.");
    }
  }

  promptUninstall() {
    this.safety.uninstallModalOpen.set(true);
    this.enteredUninstallCode = '';
  }

  submitUninstallCode() {
    this.safety.verifyUninstallCode(this.enteredUninstallCode);
  }
}

