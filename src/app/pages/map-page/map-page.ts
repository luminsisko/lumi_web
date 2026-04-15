import { KeyValuePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import {
  AstronomyResponse,
  LocalNearbyPlace,
  LumiApi,
  NearbyPlace,
  WeatherForecast,
  WeatherResponse
} from '../../services/lumi-api';

@Component({
  selector: 'app-map-page',
  imports: [KeyValuePipe],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss'
})
export class MapPage implements AfterViewInit, OnInit {
  private readonly helsinkiCenter: L.LatLngExpression = [60.1699, 24.9384];
  private readonly fieldLabels: Record<string, string> = {
    region_id: 'Weather Region',
    source: 'Weather Source',
    now: 'Now',
    plus_1_hour: 'In 1 Hour',
    forecast_for: 'Forecast Time',
    condition: 'Condition',
    intensity: 'Intensity',
    temperature_c: 'Temperature',
    feels_like_c: 'Feels Like',
    wind_m_s: 'Wind Speed',
    gusts_m_s: 'Wind Gusts',
    visibility_m: 'Visibility',
    fog: 'Fog',
    snow: 'Snow',
    precipitation_mm: 'Precipitation',
    precipitation_probability: 'Precipitation Probability',
    thunder_probability: 'Thunder Probability',
    confidence: 'Confidence',
    confidence_reason: 'Confidence Reasons',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    osm_id: 'OSM ID',
    osm_type: 'OSM Type',
    latitude: 'Latitude',
    longitude: 'Longitude',
    category: 'Category',
    city: 'City',
    area: 'Area',
    experience_kind: 'Experience Kind',
    description: 'Description',
    is_always_open: 'Always Open',
    opening_hours_raw: 'Opening Hours',
    hours_note: 'Hours Note',
    mood_tags: 'Mood Tags',
    weather_tags: 'Weather Tags',
    time_of_day_tags: 'Time Of Day Tags',
    season_tags: 'Season Tags',
    best_months: 'Best Months',
    subcategory: 'Subcategory',
    address: 'Address',
    distance_meters: 'Distance',
    moonrise: 'Moonrise',
    moonset: 'Moonset',
    moon_phase: 'Moon Phase',
    moon_illumination: 'Moon Illumination',
    dawn: 'Dawn',
    dusk: 'Dusk',
    first_light: 'First Light',
    last_light: 'Last Light',
    golden_hour: 'Golden Hour',
    day_length: 'Day Length',
    solar_noon: 'Solar Noon'
  };

  private map!: L.Map;
  private selectedMarker: L.Marker | null = null;
  private nearbyPlaceMarkers: L.Marker[] = [];
  private lumiApi = inject(LumiApi);
  private selectedLat: number | null = null;
  private selectedLng: number | null = null;
  private weatherLoadToken = 0;
  private nearbyPlacesLoadToken = 0;
  private localNearbyPlacesLoadToken = 0;
  private weatherLoaded = false;
  private astronomyLoaded = false;
  private weatherErrorMessage: string | null = null;
  private astronomyErrorMessage: string | null = null;

  selectedCoordinates = 'Helsinki center: 60.169900, 24.938400';
  backendStatus = 'Backend not checked yet';
  nearbyPlacesStatus = 'Nearby places not loaded yet';
  nearbyPlaces: NearbyPlace[] = [];
  localNearbyPlacesStatus = 'Local nearby places not loaded yet';
  localNearbyPlaces: LocalNearbyPlace[] = [];
  nearbyRadius = 250;
  nearbyLimit = 20;
  isLoading = false;
  clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  weather: WeatherResponse | null = null;
  astronomy: AstronomyResponse | null = null;
  astronomyDate = this.getCurrentDateString();
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
    this.map = L.map('map').setView(this.helsinkiCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.ngZone.run(() => {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        this.selectedLat = lat;
        this.selectedLng = lng;

        this.selectedCoordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        if (this.selectedMarker) {
          this.map.removeLayer(this.selectedMarker);
        }

        this.selectedMarker = L.marker([lat, lng]).addTo(this.map);

        this.loadWeather(lat, lng);
        this.loadNearbyPlaces(lat, lng);
        this.loadLocalNearbyPlaces(lat, lng);
        this.cdr.detectChanges();
      });
    });
  }

  onNearbyRadiusInput(value: string): void {
    const parsed = Number.parseFloat(value);

    if (Number.isFinite(parsed) && parsed > 0) {
      this.nearbyRadius = parsed;
      return;
    }

    this.nearbyRadius = 250;
  }

  onNearbyLimitInput(value: string): void {
    const parsed = Number.parseInt(value, 10);

    if (Number.isInteger(parsed) && parsed > 0) {
      this.nearbyLimit = parsed;
      return;
    }

    this.nearbyLimit = 20;
  }

  reloadNearbyPlaces(): void {
    if (this.selectedLat == null || this.selectedLng == null) {
      return;
    }

    this.loadNearbyPlaces(this.selectedLat, this.selectedLng);
    this.loadLocalNearbyPlaces(this.selectedLat, this.selectedLng);
  }

  retryWeather(): void {
    if (this.selectedLat == null || this.selectedLng == null) {
      return;
    }

    this.loadWeather(this.selectedLat, this.selectedLng);
  }

  private loadWeather(lat: number, lng: number): void {
    const loadToken = ++this.weatherLoadToken;

    this.weatherStatus = 'Loading weather and astronomy... weather may take up to 90 seconds on first refresh';
    this.weather = null;
    this.astronomy = null;
    this.weatherLoaded = false;
    this.astronomyLoaded = false;
    this.weatherErrorMessage = null;
    this.astronomyErrorMessage = null;

    console.log('Starting GET /api/weather', {
      lat,
      lon: lng,
      request: `/api/weather?lat=${lat}&lon=${lng}`,
      loadToken
    });

    this.lumiApi.getWeather(lat, lng).subscribe({
      next: (response) => {
        if (loadToken !== this.weatherLoadToken) {
          return;
        }

        console.log('GET /api/weather returned', response);
        this.weather = response;
        this.weatherLoaded = true;
        this.updateWeatherStatus();
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (loadToken !== this.weatherLoadToken) {
          return;
        }

        console.error('Weather request failed:', error);
        this.weatherErrorMessage = error.message;
        this.updateWeatherStatus();
        this.cdr.detectChanges();
      }
    });

    this.lumiApi.getAstronomy(lat, lng, this.astronomyDate).subscribe({
      next: (response) => {
        if (loadToken !== this.weatherLoadToken) {
          return;
        }

        this.astronomy = response;
        this.astronomyLoaded = true;
        this.updateWeatherStatus();
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (loadToken !== this.weatherLoadToken) {
          return;
        }

        console.error('Astronomy request failed:', error);
        this.astronomyErrorMessage = error.message;
        this.updateWeatherStatus();
        this.cdr.detectChanges();
      }
    });
  }

  private loadNearbyPlaces(lat: number, lng: number): void {
    const loadToken = ++this.nearbyPlacesLoadToken;

    this.isLoading = true;
    this.nearbyPlacesStatus = 'Loading nearby places...';
    this.nearbyPlaces = [];
    this.clearNearbyPlaceMarkers();

    this.lumiApi.getNearbyPlaces(lat, lng, this.nearbyRadius, this.nearbyLimit).subscribe({
      next: (response) => {
        if (loadToken !== this.nearbyPlacesLoadToken) {
          return;
        }

        this.nearbyPlaces = response;
        this.addNearbyPlaceMarkers(lat, lng);
        this.nearbyPlacesStatus =
          response.length > 0 ? `Loaded ${response.length} nearby places` : 'No nearby places found';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (loadToken !== this.nearbyPlacesLoadToken) {
          return;
        }

        console.error('Nearby places request failed:', error);
        this.nearbyPlacesStatus = `Nearby places error: ${error.message}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadLocalNearbyPlaces(lat: number, lng: number): void {
    const loadToken = ++this.localNearbyPlacesLoadToken;

    this.localNearbyPlacesStatus = 'Loading local nearby places...';
    this.localNearbyPlaces = [];

    this.lumiApi.getLocalNearbyPlaces(lat, lng, this.nearbyRadius, this.nearbyLimit).subscribe({
      next: (response) => {
        if (loadToken !== this.localNearbyPlacesLoadToken) {
          return;
        }

        this.localNearbyPlaces = response;
        this.localNearbyPlacesStatus =
          response.length > 0
            ? `Loaded ${response.length} local nearby places`
            : 'No local nearby places found';
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (loadToken !== this.localNearbyPlacesLoadToken) {
          return;
        }

        console.error('Local nearby places request failed:', error);
        this.localNearbyPlacesStatus = `Local nearby places error: ${error.message}`;
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
          OSM ID: ${item.osm_id ?? 'Unknown'}<br>
          OSM Type: ${item.osm_type ?? 'Unknown'}<br>
          Category: ${item.category ?? 'Unknown'}<br>
          Subcategory: ${item.subcategory ?? 'Unknown'}<br>
          Address: ${item.address ?? 'Unknown'}<br>
          Distance: ${item.distance_meters ?? 'Unknown'} meters
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

  formatFieldLabel(value: string): string {
    const explicitLabel = this.fieldLabels[value];

    if (explicitLabel) {
      return explicitLabel;
    }

    return value
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  formatFieldValue(field: string, value: unknown): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      switch (field) {
        case 'temperature_c':
        case 'feels_like_c':
          return `${value} C`;
        case 'wind_m_s':
        case 'gusts_m_s':
          return `${value} m/s`;
        case 'visibility_m':
        case 'distance_meters':
          return `${value} m`;
        case 'precipitation_mm':
          return `${value} mm`;
        case 'confidence':
          return `${Math.round(value * 100)} %`;
        case 'precipitation_probability':
        case 'thunder_probability':
        case 'moon_illumination':
          return `${value} %`;
        default:
          return `${value}`;
      }
    }

    if (typeof value === 'string') {
      return this.formatStringValue(field, value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.formatFieldValue(field, item)).filter(Boolean).join(', ');
    }

    return this.formatObjectValue(value);
  }

  hasDisplayValue(value: unknown): boolean {
    if (value == null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  weatherForecastEntries(forecast: WeatherForecast): [string, unknown][] {
    return Object.entries(forecast).filter(([, value]) => this.hasDisplayValue(value));
  }

  private formatObjectValue(value: object): string {
    return Object.entries(value)
      .filter(([, item]) => this.hasDisplayValue(item))
      .map(([key, item]) => `${this.formatFieldLabel(key)}: ${this.formatFieldValue(key, item)}`)
      .join(', ');
  }

  private formatStringValue(field: string, value: string): string {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return '';
    }

    if (this.looksLikeIsoDateTime(trimmed)) {
      return this.formatDateTime(trimmed);
    }

    if (field === 'day_length') {
      return trimmed.replace(/_/g, ' ');
    }

    return trimmed.replace(/_/g, ' ');
  }

  private formatDateTime(value: string): string {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.clientTimeZone
    }).format(parsed);
  }

  private looksLikeIsoDateTime(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
  }

  private updateWeatherStatus(): void {
    if (this.weather && this.astronomy) {
      this.weatherStatus = 'Weather and astronomy loaded';
      return;
    }

    if (this.weatherLoaded && this.astronomyErrorMessage) {
      this.weatherStatus = `Weather loaded, astronomy error: ${this.astronomyErrorMessage}`;
      return;
    }

    if (this.astronomyLoaded && this.weatherErrorMessage) {
      this.weatherStatus = `Astronomy loaded, weather error: ${this.weatherErrorMessage}`;
      return;
    }

    if (this.weatherErrorMessage && this.astronomyErrorMessage) {
      this.weatherStatus = `Weather error: ${this.weatherErrorMessage}; Astronomy error: ${this.astronomyErrorMessage}`;
      return;
    }

    if (this.weatherLoaded) {
      this.weatherStatus = 'Weather loaded, astronomy loading...';
      return;
    }

    if (this.astronomyLoaded) {
      this.weatherStatus = 'Astronomy loaded, weather loading...';
      return;
    }

    if (this.weatherErrorMessage) {
      this.weatherStatus = `Weather error: ${this.weatherErrorMessage}; astronomy loading...`;
      return;
    }

    if (this.astronomyErrorMessage) {
      this.weatherStatus = `Astronomy error: ${this.astronomyErrorMessage}; weather loading...`;
    }
  }

  private getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
