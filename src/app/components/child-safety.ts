import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {SafetyService, ChildProfile, TrustedContact} from '../services/safety.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-child-safety',
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-8 pb-12">
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div class="flex items-center space-x-2 text-indigo-400 font-semibold text-sm mb-1">
            <mat-icon class="text-indigo-400">supervised_user_circle</mat-icon>
            <span>FAMILY & SAFE CONTACTS SECURITY HUB</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-white">Safe Contacts & Family Oversight</h1>
          <p class="text-slate-400 text-sm mt-1 max-w-xl">Manage trusted emergency safe contacts with explicit location privacy consent controls, monitor family geofencing, and trigger emergency alerts securely.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button 
            (click)="showAddContactModal.set(true)"
            class="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition">
            <mat-icon>person_add</mat-icon>
            <span>Add Safe Contact</span>
          </button>
          <button 
            (click)="addChildPrompt()"
            class="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition">
            <mat-icon>child_care</mat-icon>
            <span>Add Family Profile</span>
          </button>
        </div>
      </div>

      <!-- Add Safe Contact Modal -->
      @if (showAddContactModal()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div class="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 class="text-xl font-bold text-white flex items-center space-x-2">
                <mat-icon class="text-rose-500">security</mat-icon>
                <span>Add Trusted Safe Contact</span>
              </h3>
              <button (click)="showAddContactModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Name
                  <input type="text" [(ngModel)]="newContactName" placeholder="e.g. Sarah Jenkins" class="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500" />
                </label>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                  <input type="text" [(ngModel)]="newContactPhone" placeholder="e.g. +1 (555) 234-5678" class="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500" />
                </label>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Relation / Notes
                  <input type="text" [(ngModel)]="newContactRelation" placeholder="e.g. Trusted Sister / Advocate" class="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500" />
                </label>
              </div>

              <!-- Explicit Privacy Consent Checkbox -->
              <div class="p-3 bg-slate-950 rounded-xl border border-rose-500/30 flex items-start space-x-3">
                <input type="checkbox" id="consentCheck" [(ngModel)]="newContactConsent" class="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500" />
                <label for="consentCheck" class="text-xs text-slate-300 cursor-pointer">
                  <span class="font-bold text-rose-400 block mb-0.5">Explicit Location Privacy Consent</span>
                  I give explicit permission for SafeHaven to share my live GPS location and pre-defined emergency alerts with this contact when an SOS panic alert is triggered.
                </label>
              </div>

              <div class="flex space-x-3 pt-2">
                <button (click)="showAddContactModal.set(false)" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Cancel</button>
                <button (click)="saveTrustedContact()" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30">Save Safe Contact</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Safe Contacts Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-white flex items-center space-x-2">
            <mat-icon class="text-rose-500">contact_emergency</mat-icon>
            <span>Saved Safe Contacts & Privacy Consents</span>
          </h2>
          <span class="text-xs bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-slate-300 font-medium">
            Total: {{ safety.trustedContacts().length }} Contacts
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (contact of safety.trustedContacts(); track contact.id) {
            <div class="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-rose-600/20 text-rose-400 font-bold flex items-center justify-center">
                      {{ contact.name.charAt(0) }}
                    </div>
                    <div>
                      <h3 class="font-bold text-base text-white">{{ contact.name }}</h3>
                      <p class="text-xs text-slate-400">{{ contact.relation }}</p>
                    </div>
                  </div>
                  <button (click)="removeContact(contact)" class="text-slate-500 hover:text-rose-400 transition" title="Remove Contact">
                    <mat-icon class="text-sm">delete_outline</mat-icon>
                  </button>
                </div>

                <p class="text-xs text-slate-300 font-mono mb-4 flex items-center space-x-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <mat-icon class="text-xs text-rose-400">phone</mat-icon>
                  <span>{{ contact.phone }}</span>
                </p>

                <!-- Location Consent Badge & Toggle -->
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <mat-icon class="text-xs" [class.text-emerald-400]="contact.shareLocationConsent" [class.text-slate-500]="!contact.shareLocationConsent">
                      {{ contact.shareLocationConsent ? 'lock_open' : 'lock' }}
                    </mat-icon>
                    <div>
                      <span class="block text-xs font-semibold text-white">GPS Location Sharing</span>
                      <span class="text-[10px]" [class.text-emerald-400]="contact.shareLocationConsent" [class.text-slate-400]="!contact.shareLocationConsent">
                        {{ contact.shareLocationConsent ? 'Consent Granted (Active)' : 'Consent Revoked (Private)' }}
                      </span>
                    </div>
                  </div>
                  <button 
                    (click)="toggleConsent(contact)"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition border"
                    [class.bg-emerald-600]="contact.shareLocationConsent"
                    [class.text-white]="contact.shareLocationConsent"
                    [class.border-emerald-500]="contact.shareLocationConsent"
                    [class.bg-slate-800]="!contact.shareLocationConsent"
                    [class.text-slate-300]="!contact.shareLocationConsent"
                    [class.border-slate-700]="!contact.shareLocationConsent">
                    {{ contact.shareLocationConsent ? 'Revoke Consent' : 'Grant Consent' }}
                  </button>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-800 flex space-x-2">
                <a [href]="'tel:' + contact.phone" class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center space-x-1 transition">
                  <mat-icon class="text-xs">call</mat-icon>
                  <span>Call Direct</span>
                </a>
                <button 
                  (click)="sendTestAlert(contact)"
                  class="flex-1 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs flex items-center justify-center space-x-1 transition">
                  <mat-icon class="text-xs">send</mat-icon>
                  <span>Test Alert</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Family Geofencing & Oversight -->
      <div class="space-y-4 pt-6 border-t border-slate-800">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-white flex items-center space-x-2">
            <mat-icon class="text-indigo-400">child_care</mat-icon>
            <span>Child & Family Geofencing Oversight</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (child of safety.children(); track child.id) {
            <div class="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-lg">
                      {{ child.name.charAt(0) }}
                    </div>
                    <div>
                      <h3 class="font-bold text-lg text-white">{{ child.name }}</h3>
                      <p class="text-xs text-slate-400">Age {{ child.age }} • School: {{ child.school }}</p>
                    </div>
                  </div>
                  <span class="text-xs px-2.5 py-1 rounded-full font-semibold"
                        [class.bg-emerald-500/10]="child.status.includes('Safe') || child.status.includes('Home')"
                        [class.text-emerald-400]="child.status.includes('Safe') || child.status.includes('Home')"
                        [class.bg-rose-500/10]="!child.status.includes('Safe') && !child.status.includes('Home')"
                        [class.text-rose-400]="!child.status.includes('Safe') && !child.status.includes('Home')">
                    {{ child.status }}
                  </span>
                </div>

                <!-- Location & Battery -->
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 mb-4">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400 flex items-center space-x-1.5">
                      <mat-icon class="text-xs text-indigo-400">location_on</mat-icon>
                      <span>Current Location:</span>
                    </span>
                    <span class="text-slate-200 font-medium">{{ child.location }}</span>
                  </div>

                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400 flex items-center space-x-1.5">
                      <mat-icon class="text-xs text-emerald-400">battery_full</mat-icon>
                      <span>Device Battery:</span>
                    </span>
                    <span class="text-emerald-400 font-semibold">{{ child.battery }}%</span>
                  </div>

                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400 flex items-center space-x-1.5">
                      <mat-icon class="text-xs text-slate-500">update</mat-icon>
                      <span>Last Check-In:</span>
                    </span>
                    <span class="text-slate-400">{{ child.lastCheckIn }}</span>
                  </div>
                </div>

                <!-- Safe Zones -->
                <div class="mb-4">
                  <span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Configured Safe Zones (Geofencing)</span>
                  <div class="flex flex-wrap gap-2">
                    @for (zone of child.safeZones; track zone.name) {
                      <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center space-x-1">
                        <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-400]="zone.active" [class.bg-slate-500]="!zone.active"></span>
                        <span>{{ zone.name }} ({{ zone.radius }})</span>
                      </span>
                    }
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-slate-800 flex space-x-2">
                <button 
                  (click)="pingLocation(child)"
                  class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center space-x-1 transition">
                  <mat-icon class="text-xs">radar</mat-icon>
                  <span>Request Live Ping</span>
                </button>
                <button 
                  (click)="checkInAlert(child)"
                  class="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs flex items-center justify-center space-x-1 transition">
                  <mat-icon class="text-xs">notification_important</mat-icon>
                  <span>Send Safety Check</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class ChildSafety {
  safety = inject(SafetyService);

  showAddContactModal = signal<boolean>(false);
  newContactName = '';
  newContactPhone = '';
  newContactRelation = '';
  newContactConsent = false;

  async saveTrustedContact() {
    if (!this.newContactName || !this.newContactPhone) {
      alert("Please enter both contact name and phone number.");
      return;
    }
    const verified = await this.safety.requestBiometricAuth('Authenticate via WebAuthn Biometric to save new trusted safe contact');
    if (!verified) return;

    this.safety.addTrustedContact(
      this.newContactName,
      this.newContactPhone,
      this.newContactRelation || 'Trusted Contact',
      this.newContactConsent
    );

    this.newContactName = '';
    this.newContactPhone = '';
    this.newContactRelation = '';
    this.newContactConsent = false;
    this.showAddContactModal.set(false);
  }

  sendTestAlert(contact: TrustedContact) {
    const gpsInfo = contact.shareLocationConsent && this.safety.currentGpsLocation()
      ? `\n\nGPS Location: Lat ${this.safety.currentGpsLocation()?.lat}, Lng ${this.safety.currentGpsLocation()?.lng}`
      : `\n\n(GPS Location Withheld per Privacy Consent Settings)`;

    alert(`[TEST ALERT SENT TO ${contact.name.toUpperCase()}]\n\nMessage: "${this.safety.emergencyMessage()}"${gpsInfo}`);
  }

  async removeContact(contact: TrustedContact) {
    const verified = await this.safety.requestBiometricAuth(`Authenticate via WebAuthn Biometric to remove trusted safe contact ${contact.name}`);
    if (verified) {
      this.safety.removeTrustedContact(contact.id);
    }
  }

  async toggleConsent(contact: TrustedContact) {
    const verified = await this.safety.requestBiometricAuth(`Authenticate via WebAuthn Biometric to modify location privacy consent for ${contact.name}`);
    if (verified) {
      this.safety.toggleContactConsent(contact.id);
    }
  }

  async addChildPrompt() {
    const verified = await this.safety.requestBiometricAuth('Authenticate via WebAuthn Biometric to add family member profile');
    if (!verified) return;

    const name = prompt("Enter child or family member name:");
    const ageStr = prompt("Enter age:");
    const school = prompt("Enter school or primary location:");
    if (name && ageStr) {
      const newChild: ChildProfile = {
        id: 'child-' + Date.now(),
        name,
        age: Number(ageStr) || 10,
        school: school || 'Local School',
        location: 'Home Safe Zone',
        status: 'At Home',
        battery: 100,
        lastCheckIn: 'Just now',
        safeZones: [
          {name: 'Home', radius: '150m', active: true},
          {name: 'School', radius: '200m', active: true}
        ]
      };
      this.safety.children.update(list => [...list, newChild]);
    }
  }

  async pingLocation(child: ChildProfile) {
    const verified = await this.safety.requestBiometricAuth(`Authenticate via WebAuthn Biometric to request live GPS ping for ${child.name}`);
    if (verified) {
      alert(`GPS Ping request sent to ${child.name}'s device. Encrypted coordinates updating...`);
    }
  }

  async checkInAlert(child: ChildProfile) {
    const verified = await this.safety.requestBiometricAuth(`Authenticate via WebAuthn Biometric to send safety check to ${child.name}`);
    if (verified) {
      alert(`Safety check notification sent to ${child.name}. Awaiting tap-to-confirm response.`);
    }
  }
}
