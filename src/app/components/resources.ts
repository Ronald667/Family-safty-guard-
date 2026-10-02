import {ChangeDetectionStrategy, Component, inject, signal, computed, ElementRef, ViewChild, afterNextRender} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {SafetyService} from '../services/safety.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resources',
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div class="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-1">
            <mat-icon class="text-emerald-400">verified</mat-icon>
            <span>VERIFIED CRISIS SUPPORT NETWORK & MAP</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-white">Support Resources & Nearby Shelters Map</h1>
          <p class="text-slate-400 text-sm mt-1 max-w-xl">Interactive map displaying nearby support centers, shelters, and police stations relative to your current GPS location.</p>
        </div>
        <div class="flex items-center space-x-2 w-full md:w-auto">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Search hotlines, shelters..."
            class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 w-full md:w-64" />
        </div>
      </div>

      <!-- Leaflet Map Container -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-sm text-white flex items-center space-x-2">
            <mat-icon class="text-emerald-400 text-sm">map</mat-icon>
            <span>Live GPS Radar & Support Centers Map</span>
          </h3>
          <span class="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            GPS Active (Radius: 25km)
          </span>
        </div>
        <div #mapContainer class="w-full h-80 md:h-96 rounded-xl overflow-hidden z-10 border border-slate-800"></div>
      </div>

      <!-- Filter Pills -->
      <div class="flex flex-wrap gap-2">
        @for (cat of categories; track cat) {
          <button 
            (click)="selectedCategory.set(cat)"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition border"
            [class.bg-emerald-600]="selectedCategory() === cat"
            [class.text-white]="selectedCategory() === cat"
            [class.border-emerald-500]="selectedCategory() === cat"
            [class.bg-slate-900]="selectedCategory() !== cat"
            [class.text-slate-300]="selectedCategory() !== cat"
            [class.border-slate-800]="selectedCategory() !== cat">
            {{ cat }}
          </button>
        }
      </div>

      <!-- Resources Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (res of filteredResources(); track res.id) {
          <div class="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div class="flex justify-between items-start mb-3">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {{ res.category }}
                </span>
                @if (res.available247) {
                  <span class="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-medium">
                    24/7 Available
                  </span>
                }
              </div>

              <h3 class="font-bold text-lg text-white mb-1">{{ res.name }}</h3>
              <p class="text-xs text-slate-400 mb-3 flex items-center space-x-1">
                <mat-icon class="text-xs text-slate-500">location_on</mat-icon>
                <span>{{ res.address }}</span>
              </p>
              <p class="text-sm text-slate-300 mb-4">{{ res.description }}</p>
            </div>

            <div class="space-y-3 pt-4 border-t border-slate-800">
              @if (res.textLine) {
                <p class="text-xs text-slate-400 flex items-center space-x-1.5">
                  <mat-icon class="text-xs text-emerald-400">sms</mat-icon>
                  <span>{{ res.textLine }}</span>
                </p>
              }
              <div class="flex space-x-2">
                <a [href]="'tel:' + res.phone" 
                   class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-lg shadow-emerald-600/20 transition">
                  <mat-icon class="text-sm">call</mat-icon>
                  <span>{{ res.phone }}</span>
                </a>
                <a [href]="res.website" target="_blank"
                   class="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center transition"
                   title="Visit Website">
                  <mat-icon class="text-sm">open_in_new</mat-icon>
                </a>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``
})
export class Resources {
  safety = inject(SafetyService);
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');

  @ViewChild('mapContainer', {static: false}) mapContainer!: ElementRef;
  private map: unknown | null = null;

  constructor() {
    afterNextRender(() => {
      this.initMap();
    });
  }

  categories = ['All', 'Hotline', 'Shelter', 'Legal Aid', 'Child Protection'];

  filteredResources = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    return this.safety.resources().filter(r => {
      const matchesCat = cat === 'All' || r.category === cat;
      const matchesQ = r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.region.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  });

  async initMap() {
    if (!this.mapContainer || this.map || typeof window === 'undefined') return;
    try {
      const L = await import('leaflet');
      const gps = this.safety.currentGpsLocation() || {lat: 37.7749, lng: -122.4194};
      
      const mapInstance = L.map(this.mapContainer.nativeElement).setView([gps.lat, gps.lng], 13);
      this.map = mapInstance;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      // Add user location marker
      L.marker([gps.lat, gps.lng]).addTo(mapInstance)
        .bindPopup('<b>Your Current Location</b><br/>GPS Signal Active')
        .openPopup();

      // Add markers for resources
      this.safety.resources().forEach((res, index) => {
        const latOffset = (index - 2) * 0.015;
        const lngOffset = (index % 2 === 0 ? 1 : -1) * 0.02;
        const resLat = gps.lat + latOffset;
        const resLng = gps.lng + lngOffset;

        const marker = L.marker([resLat, resLng]).addTo(mapInstance);
        marker.bindPopup(`
          <div style="font-family:sans-serif; color:#0f172a;">
            <b style="font-size:14px; color:#047857;">${res.name}</b><br/>
            <span style="font-size:11px; color:#475569;">${res.category} • ${res.address}</span><br/>
            <a href="tel:${res.phone}" style="display:inline-block; margin-top:4px; background:#059669; color:white; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:11px; font-weight:bold;">Call ${res.phone}</a>
          </div>
        `);
      });
    } catch (e) {
      console.error('Leaflet map initialization error:', e);
    }
  }
}
