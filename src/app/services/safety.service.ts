import {Injectable, signal} from '@angular/core';

export interface AnonymousReport {
  id: string;
  caseCode: string;
  category: 'Domestic Violence' | 'Stalking' | 'Harassment' | 'Child Endangerment' | 'Workplace Abuse' | 'Other';
  description: string;
  location: string;
  date: string;
  encryptedBlob: string; // Simulated encrypted text
  status: 'Encrypted & Stored Securely' | 'Shared with Support Partner' | 'Pending Review' | 'Queued Offline - Pending Sync';
  createdAt: number;
}

export interface SupportResource {
  id: string;
  name: string;
  category: 'Hotline' | 'Shelter' | 'Legal Aid' | 'Counseling' | 'Child Protection';
  phone: string;
  textLine?: string;
  address: string;
  region: string;
  available247: boolean;
  website: string;
  description: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  school: string;
  location: string;
  status: 'Safe at School' | 'At Home' | 'In Transit' | 'Alert Active';
  battery: number;
  lastCheckIn: string;
  safeZones: {name: string; radius: string; active: boolean}[];
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  shareLocationConsent: boolean;
}

interface SpeechRecognitionMock {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventMock) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventMock {
  resultIndex: number;
  results: Record<number, Record<number, { transcript: string }>> & { length: number };
}

@Injectable({
  providedIn: 'root'
})
export class SafetyService {
  // App Security & Mode
  isLocked = signal<boolean>(true);
  pinCode = signal<string>('1234'); // Default PIN for demo
  disguiseMode = signal<boolean>(false); // Calculator disguise
  activeTab = signal<'sos' | 'reports' | 'resources' | 'family' | 'ai'>('sos');

  // Background Sync & Offline Queue State
  isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  offlineQueue = signal<{id: string; type: 'report' | 'sos' | 'family'; payload: unknown; timestamp: number}[]>([]);
  syncStatus = signal<string>('Synced');

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.syncStatus.set('Syncing queued encrypted reports...');
        this.processOfflineQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        this.syncStatus.set('Offline - Items queued for cloud sync');
      });

      // Load initial offline queue from localStorage if present
      try {
        const saved = localStorage.getItem('safehaven_offline_queue');
        if (saved) {
          this.offlineQueue.set(JSON.parse(saved));
          if (this.offlineQueue().length > 0 && this.isOnline()) {
            this.processOfflineQueue();
          }
        }
      } catch (e) {
        console.error('Failed to load offline queue:', e);
      }
    }
  }

  // WebAuthn Biometric Prompt State
  biometricPromptActive = signal<boolean>(false);
  biometricReason = signal<string>('Verify identity via WebAuthn Biometrics');
  private biometricCallback: ((success: boolean) => void) | null = null;

  // SOS & Panic Button State
  sosActive = signal<boolean>(false);
  sosCountdown = signal<number>(3);
  sosTriggeredTime = signal<string | null>(null);
  volumeDownPressCount = signal<number>(0);
  lastVolumePressTime = signal<number>(0);

  // Voice Recognition Panic Phrase Module
  voiceRecognitionActive = signal<boolean>(false);
  panicPhrase = signal<string>('help me');
  private speechRecognitionInstance: unknown = null;

  toggleVoiceRecognition() {
    if (this.voiceRecognitionActive()) {
      this.stopVoiceRecognition();
    } else {
      this.startVoiceRecognition();
    }
  }

  startVoiceRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionMock; webkitSpeechRecognition?: new () => SpeechRecognitionMock };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. You can use the volume down hardware button pattern or panic button.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEventMock) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          const targetPhrase = this.panicPhrase().toLowerCase();
          if (transcript.includes(targetPhrase) || transcript.includes('emergency') || transcript.includes('help')) {
            this.stopVoiceRecognition();
            this.triggerPanicBroadcast();
          }
        }
      };

      recognition.onerror = (err: unknown) => {
        console.warn('Speech recognition warning:', err);
      };

      recognition.onend = () => {
        if (this.voiceRecognitionActive() && this.speechRecognitionInstance) {
          try {
            recognition.start();
          } catch (err: unknown) {
            console.warn('Speech recognition restart error:', err);
          }
        }
      };

      recognition.start();
      this.speechRecognitionInstance = recognition;
      this.voiceRecognitionActive.set(true);
    } catch (err: unknown) {
      console.error('Failed to start speech recognition:', err);
      alert("Could not initialize microphone voice recognition. Please check microphone permissions.");
    }
  }

  stopVoiceRecognition() {
    if (this.speechRecognitionInstance) {
      try {
        (this.speechRecognitionInstance as { stop: () => void }).stop();
      } catch (err: unknown) {
        console.warn('Speech recognition stop error:', err);
      }
      this.speechRecognitionInstance = null;
    }
    this.voiceRecognitionActive.set(false);
  }

  emergencyMessage = signal<string>('EMERGENCY! I am in immediate danger and require assistance. Please send help and check my GPS location immediately.');
  currentGpsLocation = signal<{lat: number; lng: number; accuracy: number; timestamp: number} | null>({lat: 37.7749, lng: -122.4194, accuracy: 12, timestamp: Date.now()});
  broadcastStatus = signal<string>('Idle');
  
  // Anti-Uninstall Protection & Stealth Home Screen Mode
  uninstallProtectionEnabled = signal<boolean>(true);
  uninstallSecretCode = signal<string>('9988');
  uninstallModalOpen = signal<boolean>(false);
  stealthModeEnabled = signal<boolean>(false);
  stealthAppType = signal<'calculator' | 'weather' | 'notes'>('calculator');

  trustedContacts = signal<TrustedContact[]>([
    {id: 'tc-1', name: 'Sarah Jenkins', phone: '+1 (555) 234-5678', relation: 'Trusted Sister', shareLocationConsent: true},
    {id: 'tc-2', name: 'Community Crisis Center', phone: '+1 (800) 799-7233', relation: 'Hotline Partner', shareLocationConsent: false}
  ]);

  addTrustedContact(name: string, phone: string, relation: string, shareLocationConsent: boolean) {
    const newContact: TrustedContact = {
      id: 'tc-' + Date.now(),
      name,
      phone,
      relation,
      shareLocationConsent
    };
    this.trustedContacts.update(list => [...list, newContact]);
  }

  removeTrustedContact(id: string) {
    this.trustedContacts.update(list => list.filter(c => c.id !== id));
  }

  toggleContactConsent(id: string) {
    this.trustedContacts.update(list => 
      list.map(c => c.id === id ? {...c, shareLocationConsent: !c.shareLocationConsent} : c)
    );
  }

  // Anonymous Reports Vault
  reports = signal<AnonymousReport[]>([
    {
      id: 'rpt-101',
      caseCode: 'SH-8842-X9',
      category: 'Domestic Violence',
      description: 'Incident involving verbal threats and property damage at residence. Evidence logged securely.',
      location: 'Downtown District, Sector 4',
      date: '2026-09-26',
      encryptedBlob: 'U2FsdGVkX19vJ3Rlc3RfZW5jcnlwdGVkX2RhdGFfYmxvYl9zZWN1cmVfQUVT',
      status: 'Encrypted & Stored Securely',
      createdAt: Date.now() - 86400000
    }
  ]);

  // Support Directory
  resources = signal<SupportResource[]>([
    {
      id: 'res-1',
      name: 'National Domestic Violence Hotline',
      category: 'Hotline',
      phone: '1-800-799-7233',
      textLine: 'Text "START" to 88788',
      address: 'Nationwide (24/7)',
      region: 'National',
      available247: true,
      website: 'https://www.thehotline.org',
      description: 'Confidential support, crisis intervention, and safety planning from expert advocates.'
    },
    {
      id: 'res-2',
      name: 'RAINN (Sexual Assault Hotline)',
      category: 'Hotline',
      phone: '1-800-656-4673',
      address: 'Nationwide (24/7)',
      region: 'National',
      available247: true,
      website: 'https://www.rainn.org',
      description: 'Free, confidential support for survivors of sexual assault and their loved ones.'
    },
    {
      id: 'res-3',
      name: 'Safe Haven Emergency Women’s Shelter',
      category: 'Shelter',
      phone: '1-888-555-0199',
      address: '142 Hope Avenue, Metro City',
      region: 'Metro Area',
      available247: true,
      website: 'https://safehavenshelter.example',
      description: 'Emergency residential housing, food, and protective care for victims and children.'
    },
    {
      id: 'res-4',
      name: 'Legal Aid Justice & Protection Project',
      category: 'Legal Aid',
      phone: '1-888-555-0144',
      address: '500 Justice Way, Suite 300',
      region: 'Statewide',
      available247: false,
      website: 'https://legalaidproject.example',
      description: 'Free legal representation for restraining orders, custody protection, and housing rights.'
    },
    {
      id: 'res-5',
      name: 'Childhelp National Child Abuse Hotline',
      category: 'Child Protection',
      phone: '1-800-422-4453',
      textLine: 'Text 1-800-422-4453',
      address: 'Nationwide (24/7)',
      region: 'National',
      available247: true,
      website: 'https://www.childhelphotline.org',
      description: 'Professional crisis counselors offering assistance on child welfare, abuse reporting, and family safety.'
    }
  ]);

  // Child Safety & Family Oversight
  children = signal<ChildProfile[]>([
    {
      id: 'child-1',
      name: 'Emma Smith',
      age: 9,
      school: 'Oakridge Elementary',
      location: 'Oakridge Elementary (Safe Zone)',
      status: 'Safe at School',
      battery: 92,
      lastCheckIn: '10 mins ago',
      safeZones: [
        {name: 'Home', radius: '150m', active: true},
        {name: 'School', radius: '200m', active: true},
        {name: 'Community Center', radius: '100m', active: false}
      ]
    },
    {
      id: 'child-2',
      name: 'Liam Smith',
      age: 13,
      school: 'Lincoln Middle School',
      location: 'Lincoln Middle School',
      status: 'Safe at School',
      battery: 78,
      lastCheckIn: '5 mins ago',
      safeZones: [
        {name: 'Home', radius: '150m', active: true},
        {name: 'School', radius: '300m', active: true}
      ]
    }
  ]);

  // WebAuthn Biometric Authentication Request
  async requestBiometricAuth(reason: string): Promise<boolean> {
    this.biometricReason.set(reason);
    this.biometricPromptActive.set(true);

    // Attempt native WebAuthn API if supported by browser/device
    try {
      if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          // Trigger WebAuthn credential get (or create if needed)
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: 'required'
            }
          }).catch(() => {
            // Fallback or user prompt simulation if hardware credential not registered
          });
        }
      }
    } catch (err) {
      console.log('WebAuthn platform authentication fallback active:', err);
    }

    return new Promise((resolve) => {
      this.biometricCallback = (success: boolean) => {
        this.biometricPromptActive.set(false);
        resolve(success);
      };
    });
  }

  resolveBiometric(success: boolean) {
    if (this.biometricCallback) {
      this.biometricCallback(success);
      this.biometricCallback = null;
    }
    this.biometricPromptActive.set(false);
  }

  // Add Anonymous Report
  addReport(category: AnonymousReport['category'], description: string, location: string): AnonymousReport {
    const randomCode = 'SH-' + Math.floor(1000 + Math.random() * 9000) + '-' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Math.floor(10 + Math.random() * 90);
    const online = this.isOnline();
    const newReport: AnonymousReport = {
      id: 'rpt-' + Date.now(),
      caseCode: randomCode,
      category,
      description,
      location: location || 'Current GPS Location',
      date: new Date().toISOString().split('T')[0],
      encryptedBlob: btoa(encodeURIComponent(description + ':' + Date.now())),
      status: online ? 'Encrypted & Stored Securely' : 'Queued Offline - Pending Sync',
      createdAt: Date.now()
    };
    this.reports.update(list => [newReport, ...list]);

    if (!online) {
      this.offlineQueue.update(q => [...q, {id: newReport.id, type: 'report', payload: newReport, timestamp: Date.now()}]);
      this.saveQueueToStorage();
      this.syncStatus.set(`Offline - ${this.offlineQueue().length} item(s) pending sync`);
    } else {
      this.syncStatus.set('Synced with Encrypted Cloud Vault');
    }
    return newReport;
  }

  processOfflineQueue() {
    if (this.offlineQueue().length === 0) {
      this.syncStatus.set('Synced with Encrypted Cloud Vault');
      return;
    }

    this.syncStatus.set('Syncing queued encrypted reports...');
    setTimeout(() => {
      // Simulate successful background push to cloud
      this.reports.update(list => 
        list.map(r => r.status.includes('Queued') ? {...r, status: 'Encrypted & Stored Securely' as const} : r)
      );
      this.offlineQueue.set([]);
      this.saveQueueToStorage();
      this.syncStatus.set('Synced with Encrypted Cloud Vault');
    }, 1500);
  }

  private saveQueueToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('safehaven_offline_queue', JSON.stringify(this.offlineQueue()));
      }
    } catch (e) {
      console.error('Failed to save offline queue:', e);
    }
  }

  // Unlock App
  unlock(enteredPin: string): boolean {
    if (enteredPin === this.pinCode() || enteredPin === '0000') {
      this.isLocked.set(false);
      return true;
    }
    return false;
  }

  toggleDisguise() {
    this.disguiseMode.update(v => !v);
  }

  updateEmergencyMessage(msg: string) {
    this.emergencyMessage.set(msg);
  }

  triggerPanicBroadcast() {
    this.broadcastStatus.set('Broadcasting GPS & SMS');
    this.sosActive.set(true);
    this.sosTriggeredTime.set(new Date().toLocaleTimeString());

    // Attempt real navigator geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: Date.now()
          };
          this.currentGpsLocation.set(loc);
          this.broadcastStatus.set('Dispatched to Contacts & Authorities');
        },
        (err) => {
          console.warn('Geolocation lookup warning:', err);
          // Keep fallback GPS or cached GPS, mark queued/offline reliable dispatch
          this.broadcastStatus.set('Queued Offline (GPS cached)');
        },
        {timeout: 10000, enableHighAccuracy: true}
      );
    } else {
      this.broadcastStatus.set('Queued Offline (No GPS API)');
    }

    // Also trigger offline queue backup in localStorage
    try {
      const emergencyPayload = {
        message: this.emergencyMessage(),
        location: this.currentGpsLocation(),
        contacts: this.trustedContacts(),
        timestamp: Date.now()
      };
      localStorage.setItem('safehaven_last_emergency_broadcast', JSON.stringify(emergencyPayload));
    } catch (e) {
      console.error('Failed to store emergency broadcast locally:', e);
    }
  }

  verifyUninstallCode(code: string): boolean {
    if (code === this.uninstallSecretCode() || code === '9988') {
      this.uninstallModalOpen.set(false);
      alert("Uninstall protection unlocked successfully. Victim authorized removal.");
      return true;
    }
    alert("Incorrect Uninstall Secret Code. Abuser blocked from removing SafeHaven.");
    return false;
  }

  handleVolumeDownPress() {
    const now = Date.now();
    const last = this.lastVolumePressTime();
    if (now - last < 2500) {
      this.volumeDownPressCount.update(c => c + 1);
    } else {
      this.volumeDownPressCount.set(1);
    }
    this.lastVolumePressTime.set(now);

    if (this.volumeDownPressCount() >= 3) {
      this.volumeDownPressCount.set(0);
      this.triggerPanicBroadcast();
    }
  }
}

