import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { LumiApi, WeatherRegion } from '../../services/lumi-api';

type WeatherRegionLayerEntry = {
  region: WeatherRegion;
  layer: L.Polygon;
};

@Component({
  selector: 'app-admin-places-page',
  templateUrl: './admin-places-page.html',
  styleUrl: './admin-places-page.scss'
})
export class AdminPlacesPage implements AfterViewInit, OnDestroy {
  private readonly helsinkiCenter: L.LatLngExpression = [60.1699, 24.9384];
  private readonly regionStrokeColor = '#15803d';
  private readonly selectedRegionStrokeColor = '#166534';
  private readonly selectedRegionFillColor = '#22c55e';
  private readonly regionAreaColors = ['#86efac', '#bbf7d0', '#4ade80', '#a7f3d0'];
  private readonly fieldLabels: Record<string, string> = {
    region_id: 'Region ID',
    area_slug: 'Area',
    center_lat: 'Center Latitude',
    center_lon: 'Center Longitude',
    boundary: 'Boundary'
  };

  private readonly lumiApi = inject(LumiApi);
  private readonly cdr = inject(ChangeDetectorRef);

  private map: L.Map | null = null;
  private weatherRegionLayers: WeatherRegionLayerEntry[] = [];

  weatherRegionsStatus = 'Loading Helsinki weather regions...';
  weatherRegions: WeatherRegion[] = [];
  selectedWeatherRegion: WeatherRegion | null = null;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  openForm(): void {
    console.log('Add Place button clicked');
  }

  weatherRegionEntries(region: WeatherRegion): [string, unknown][] {
    return Object.entries(region).filter(([, value]) => this.hasDisplayValue(value));
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
      return `${value}`;
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.formatFieldValue(field, item))
        .filter(Boolean)
        .join(', ');
    }

    return Object.entries(value)
      .filter(([, item]) => this.hasDisplayValue(item))
      .map(([key, item]) => `${this.formatFieldLabel(key)}: ${this.formatFieldValue(key, item)}`)
      .join(', ');
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

  private initMap(): void {
    this.map = L.map('admin-places-map').setView(this.helsinkiCenter, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.loadWeatherRegions();
  }

  private loadWeatherRegions(): void {
    this.weatherRegionsStatus = 'Loading Helsinki weather regions...';
    this.clearWeatherRegionLayers();
    this.selectedWeatherRegion = null;

    this.lumiApi.getWeatherRegions().subscribe({
      next: (response) => {
        const helsinkiRegions = response.filter((region) => this.isHelsinkiRegion(region));

        this.weatherRegions = helsinkiRegions.length > 0 ? helsinkiRegions : response;
        this.renderWeatherRegionLayers(this.weatherRegions);
        this.weatherRegionsStatus =
          this.weatherRegions.length > 0
            ? `Loaded ${this.weatherRegions.length} weather regions for Helsinki`
            : 'No Helsinki weather regions returned';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Weather regions request failed:', error);
        this.weatherRegions = [];
        this.weatherRegionsStatus = `Weather regions error: ${error.message}`;
        this.cdr.detectChanges();
      }
    });
  }

  private renderWeatherRegionLayers(regions: WeatherRegion[]): void {
    const map = this.map;

    if (!map) {
      return;
    }

    const bounds = L.latLngBounds([]);

    for (const region of regions) {
      const layer = this.createWeatherRegionLayer(region);

      if (!layer) {
        continue;
      }

      layer.addTo(map);
      this.weatherRegionLayers.push({ region, layer });

      const layerBounds = this.getLayerBounds(layer, region);

      if (layerBounds?.isValid()) {
        bounds.extend(layerBounds);
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }

  private createWeatherRegionLayer(region: WeatherRegion): L.Polygon | null {
    const popupContent = this.buildWeatherRegionPopup(region);
    const ring = this.getRegionRing(region);

    if (!ring) {
      return null;
    }

    const layer = L.polygon(ring, {
      color: this.regionStrokeColor,
      weight: 3,
      opacity: 1,
      fillColor: this.getAreaFillColor(region.area_slug),
      fillOpacity: 0
    }).bindPopup(popupContent);

    layer.on('click', (event: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(event);
      this.selectedWeatherRegion = region;
      this.applySelectionStyles();
      layer.openPopup(event.latlng);
      this.cdr.detectChanges();
    });

    return layer;
  }

  private clearWeatherRegionLayers(): void {
    const map = this.map;

    if (!map) {
      return;
    }

    for (const entry of this.weatherRegionLayers) {
      map.removeLayer(entry.layer);
    }

    this.weatherRegionLayers = [];
  }

  private applySelectionStyles(): void {
    for (const entry of this.weatherRegionLayers) {
      const isSelected = this.selectedWeatherRegion?.region_id === entry.region.region_id;
      this.applyStyleToLayer(entry.layer, isSelected);
    }
  }

  private applyStyleToLayer(layer: L.Polygon, isSelected: boolean): void {
    const style = isSelected
      ? {
          color: this.selectedRegionStrokeColor,
          weight: 3,
          opacity: 1,
          fillColor: this.selectedRegionFillColor,
          fillOpacity: 0.2
        }
      : {
          color: this.regionStrokeColor,
          weight: 3,
          opacity: 1,
          fillColor: this.getAreaFillColor(this.findRegionByLayer(layer)?.area_slug ?? null),
          fillOpacity: 0
        };
    layer.setStyle(style);
  }

  private getLayerBounds(layer: L.Layer, region: WeatherRegion): L.LatLngBounds | null {
    if ('getBounds' in layer && typeof layer.getBounds === 'function') {
      return layer.getBounds();
    }

    if (region.center_lat != null && region.center_lon != null) {
      return L.latLngBounds([[region.center_lat, region.center_lon]]);
    }

    return null;
  }

  private buildWeatherRegionPopup(region: WeatherRegion): string {
    const title = region.area_slug ?? region.region_id;
    const lines = [`<strong>${title}</strong>`];

    if (region.region_id !== title) {
      lines.push(`ID: ${region.region_id}`);
    }

    if (region.center_lat != null && region.center_lon != null) {
      lines.push(`Center: ${region.center_lat}, ${region.center_lon}`);
    }

    return lines.join('<br>');
  }

  private isHelsinkiRegion(region: WeatherRegion): boolean {
    const searchText = `${region.area_slug ?? ''} ${region.region_id}`.toLowerCase();

    if (searchText.includes('helsinki')) {
      return true;
    }

    if (region.center_lat == null || region.center_lon == null) {
      return false;
    }

    return (
      region.center_lat >= 60.1 &&
      region.center_lat <= 60.35 &&
      region.center_lon >= 24.5 &&
      region.center_lon <= 25.3
    );
  }

  private getRegionRing(region: WeatherRegion): L.LatLngTuple[] | null {
    const ring = region.boundary?.coordinates?.[0];

    if (!Array.isArray(ring) || ring.length === 0) {
      return null;
    }

    const latLngRing = ring
      .filter(
        (point): point is number[] =>
          Array.isArray(point) &&
          point.length >= 2 &&
          typeof point[0] === 'number' &&
          typeof point[1] === 'number'
      )
      .map(([lon, lat]) => [lat, lon] as L.LatLngTuple);

    return latLngRing.length > 0 ? latLngRing : null;
  }

  private getAreaFillColor(areaSlug: string | null): string {
    if (!areaSlug) {
      return this.regionAreaColors[0];
    }

    const hash = Array.from(areaSlug).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return this.regionAreaColors[hash % this.regionAreaColors.length];
  }

  private findRegionByLayer(layer: L.Polygon): WeatherRegion | null {
    const entry = this.weatherRegionLayers.find((item) => item.layer === layer);
    return entry?.region ?? null;
  }
}
