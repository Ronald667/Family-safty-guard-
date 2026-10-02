import {ChangeDetectionStrategy, Component, inject, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {SafetyService} from './services/safety.service';
import {Lock} from './components/lock';
import {Calculator} from './components/calculator';
import {Sos} from './components/sos';
import {Reports} from './components/reports';
import {Resources} from './components/resources';
import {ChildSafety} from './components/child-safety';
import {AiAssistant} from './components/ai-assistant';
import {BiometricModal} from './components/biometric-modal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    MatIconModule,
    Lock,
    Calculator,
    Sos,
    Reports,
    Resources,
    ChildSafety,
    AiAssistant,
    BiometricModal
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  safety = inject(SafetyService);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Listen for volume down or designated emergency shortcut keys (e.g. ArrowDown, VolumeDown, or 'v')
    if (event.key === 'AudioVolumeDown' || event.key === 'ArrowDown' || event.key === 'v' || event.key === 'V') {
      this.safety.handleVolumeDownPress();
    }
  }

  setTab(tab: 'sos' | 'reports' | 'resources' | 'family' | 'ai') {
    this.safety.activeTab.set(tab);
  }

  lockApp() {
    this.safety.isLocked.set(true);
  }
}
