import { AfterViewInit, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-page',
  imports: [],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss'
})
export class MapPage implements AfterViewInit {
  private map!: L.Map;
  private marker: L.Marker | null = null;

  selectedCoordinates = 'Nothing selected yet';

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

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

        // Remove previous marker
        if (this.marker) {
          this.map.removeLayer(this.marker);
        }

        // Add new marker
        this.marker = L.marker([lat, lng]).addTo(this.map);

        this.cdr.detectChanges();
      });
    });
  }
}