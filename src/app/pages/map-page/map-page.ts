import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { LumiApi, NearbyPlace, WeatherResponse } from '../../services/lumi-api';

@Component({
  selector: 'app-map-page',
  imports: [],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss'
})
export class MapPage implements AfterViewInit, OnInit {
  private map!: L.Map;
  private selectedMarker: L.Marker | null = null;
  private nearbyPlaceMarkers: L.Marker[] = [];
  private lumiApi = inject(LumiApi);

  selectedCoordinates = 'Nothing selected yet';
  backendStatus = 'Backend not checked yet';
  nearbyPlaces: NearbyPlace[] = [];
  isLoading = false;

  weather: WeatherResponse | null = null;
  weatherStatus = 'Weather not loaded yet';

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.lumiApi.getHealth().subscribe({
      next: (response) => {
        this.backendStatus = `Backend connected: ${JSON.stringify(response)}`;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.backendStatus = `Backend error: ${error.message}`;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map').setView([60.1699, 24.9384], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.ngZone.run(() => {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        this.selectedCoordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        if (this.selectedMarker) {
          this.map.removeLayer(this.selectedMarker);
        }

        this.selectedMarker = L.marker([lat, lng]).addTo(this.map);

        this.loadWeather(lat, lng);
        this.loadNearbyPlaces(lat, lng);
        this.cdr.detectChanges();
      });
    });
  }

  private loadWeather(lat: number, lng: number): void {
    this.weatherStatus = 'Loading weather...';
    this.weather = null;

    this.lumiApi.getWeather(lat, lng).subscribe({
      next: (response) => {
        this.weather = response;
        this.weatherStatus = 'Weather loaded';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Weather request failed:', error);
        this.weatherStatus = `Weather error: ${error.message}`;
        this.cdr.detectChanges();
      }
    });
  }

  private loadNearbyPlaces(lat: number, lng: number): void {
    this.isLoading = true;
    this.nearbyPlaces = [];
    this.clearNearbyPlaceMarkers();

    this.lumiApi.getNearbyPlaces(lat, lng).subscribe({
      next: (response) => {
        this.nearbyPlaces = response;
        this.addNearbyPlaceMarkers(lat, lng);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Nearby places request failed:', error);
        this.backendStatus = `Nearby places error: ${error.message}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private addNearbyPlaceMarkers(selectedLat: number, selectedLng: number): void {
    const bounds = L.latLngBounds([[selectedLat, selectedLng]]);

    for (const item of this.nearbyPlaces) {
      if (item.latitude == null || item.longitude == null) {
        continue;
      }

      const marker = L.marker([item.latitude, item.longitude])
        .addTo(this.map)
        .bindPopup(`
          <strong>${item.name}</strong><br>
          ${item.category ?? 'Place'}<br>
          ${item.address ?? ''}
        `);

      this.nearbyPlaceMarkers.push(marker);
      bounds.extend([item.latitude, item.longitude]);
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  private clearNearbyPlaceMarkers(): void {
    for (const marker of this.nearbyPlaceMarkers) {
      this.map.removeLayer(marker);
    }

    this.nearbyPlaceMarkers = [];
  }
}
