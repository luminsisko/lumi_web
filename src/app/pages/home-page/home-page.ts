import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements AfterViewInit, OnDestroy {
  readonly moods = ['Relaxed', 'Curious', 'Romantic', 'Adventurous', 'Cozy', 'Energetic'];

  @ViewChild('homeMap') private homeMapRef?: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private selectedMarker: L.Marker | null = null;

  selectedMood = '';
  walkingDistanceKm = 1;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  onMoodChange(value: string): void {
    this.selectedMood = value;
  }

  onDistanceInput(value: string): void {
    const parsed = Number.parseFloat(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    this.walkingDistanceKm = parsed;
  }

  private initMap(): void {
    const host = this.homeMapRef?.nativeElement;

    if (!host) {
      return;
    }

    this.map = L.map(host, {
      zoomControl: true
    }).setView([60.1699, 24.9384], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const map = this.map;

      if (!map) {
        return;
      }

      if (this.selectedMarker) {
        map.removeLayer(this.selectedMarker);
      }

      this.selectedMarker = L.marker(event.latlng).addTo(map);
    });
  }
}
