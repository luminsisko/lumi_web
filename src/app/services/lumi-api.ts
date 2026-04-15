import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';

export interface WalkRequest {
  area: string;
  mood: string;
  time_available: number;
  transport: string;
  weather: string;
  user_lat: number;
  user_lon: number;
}

export interface Suggestion {
  name: string;
  category: string;
  area: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  score: number;
  reasoning: string[];
}

export interface WalkResponse {
  message: string;
  suggestions: Suggestion[];
}

export interface PlaceCreateRequest {
  name: string;
  city: string;
  area: string;
  category: string;
  place_kind: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  open_time: string | null;
  close_time: string | null;
  mood_tags: string | null;
  weather_tags: string | null;
  time_of_day_tags: string | null;
  season_tags: string | null;
  best_months: string | null;
}

export interface PlaceRecord {
  id: string | null;
  name: string;
  city: string | null;
  area: string | null;
  category: string | null;
  place_kind: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  open_time: string | null;
  close_time: string | null;
  mood_tags: string | null;
  weather_tags: string | null;
  time_of_day_tags: string | null;
  season_tags: string | null;
  best_months: string | null;
}

export interface NearbyPlace {
  osm_id: number | null;
  osm_type: string | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  subcategory: string | null;
  address: string | null;
  distance_meters: number | null;
}

export interface LocalNearbyPlace {
  id: string | null;
  name: string;
  city: string | null;
  area: string | null;
  category: string | null;
  experience_kind: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  is_always_open: boolean | null;
  opening_hours_raw: string | null;
  hours_note: string | null;
  mood_tags: string | null;
  weather_tags: string | null;
  time_of_day_tags: string | null;
  season_tags: string | null;
  best_months: string | null;
  distance_meters: number | null;
}

export interface WeatherRegion {
  region_id: string;
  area_slug: string | null;
  center_lat: number | null;
  center_lon: number | null;
  boundary: {
    coordinates: number[][][];
  } | null;
}

export type AstronomyResponse = Record<string, unknown>;

export interface WeatherForecast extends Record<string, unknown> {
  forecast_for: string | null;
  condition: string | null;
  intensity: string | null;
  temperature_c: number | null;
  feels_like_c: number | null;
  wind_m_s: number | null;
  gusts_m_s: number | null;
  visibility_m: number | null;
  fog: boolean | null;
  snow: boolean | null;
  precipitation_mm: number | null;
  precipitation_probability: number | null;
  thunder_probability: number | null;
  confidence: number | null;
  confidence_reason: string[] | null;
}

export interface WeatherResponse extends Record<string, unknown> {
  region_id: string | null;
  source: string | null;
  now: WeatherForecast;
  plus_1_hour: WeatherForecast;
}

interface WeatherApiResponse extends Record<string, unknown> {
  region_id?: string | null;
  source?: string | null;
  now?: Record<string, unknown> | null;
  plus_1_hour?: Record<string, unknown> | null;
}

interface NearbyPlaceApiItem {
  osm_id?: number | null;
  osm_type?: string | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  subcategory?: string | null;
  address?: string | null;
  distance_meters?: number | null;
}

interface NearbyPlacesApiResponse {
  places?: NearbyPlaceApiItem[] | null;
  results?: NearbyPlaceApiItem[] | null;
  items?: NearbyPlaceApiItem[] | null;
}

interface LocalNearbyPlaceApiItem {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  area?: string | null;
  category?: string | null;
  experience_kind?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  is_always_open?: boolean | null;
  opening_hours_raw?: string | null;
  hours_note?: string | null;
  mood_tags?: string | null;
  weather_tags?: string | null;
  time_of_day_tags?: string | null;
  season_tags?: string | null;
  best_months?: string | null;
  distance_meters?: number | null;
}

interface LocalNearbyPlacesApiResponse {
  places?: LocalNearbyPlaceApiItem[] | null;
}

interface WeatherRegionApiItem extends Record<string, unknown> {
  region_id?: string | null;
  area_slug?: string | null;
  center_lat?: number | null;
  center_lon?: number | null;
  boundary?: {
    coordinates?: unknown;
  } | null;
}

interface WeatherRegionsApiResponse {
  regions?: WeatherRegionApiItem[] | null;
  items?: WeatherRegionApiItem[] | null;
  weather_regions?: WeatherRegionApiItem[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class LumiApi {
  private http = inject(HttpClient);
  private baseUrl = '/api';
  private weatherRequestTimeoutMs = 90000;
  private astronomyRequestTimeoutMs = 15000;

  getHealth(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  createPlace(payload: PlaceCreateRequest): Observable<PlaceRecord> {
    return this.http.post<PlaceRecord>(`${this.baseUrl}/places`, payload);
  }

  walk(request: WalkRequest): Observable<WalkResponse> {
    return this.http.post<WalkResponse>(`${this.baseUrl}/walk`, request);
  }

  getWeather(lat: number | string, lon: number | string): Observable<WeatherResponse> {
    const params = new HttpParams({
      fromObject: {
        lat: this.parseCoordinate(lat, 'lat'),
        lon: this.parseCoordinate(lon, 'lon')
      }
    });

    return this.http
      .get<WeatherApiResponse>(`${this.baseUrl}/weather`, { params })
      .pipe(
        timeout(this.weatherRequestTimeoutMs),
        map((response) => this.normalizeWeather(response))
      );
  }

  getAstronomy(
    lat: number | string,
    lon: number | string,
    date: string
  ): Observable<AstronomyResponse> {
    const params = new HttpParams({
      fromObject: {
        lat: this.parseCoordinate(lat, 'lat'),
        lon: this.parseCoordinate(lon, 'lon'),
        date: this.parseDate(date)
      }
    });

    return this.http
      .get<AstronomyResponse>(`${this.baseUrl}/astronomy`, { params })
      .pipe(timeout(this.astronomyRequestTimeoutMs));
  }

  getNearbyPlaces(
    lat: number | string,
    lon: number | string,
    radius: number | string = 250,
    limit: number | string = 20
  ): Observable<NearbyPlace[]> {
    const params = new HttpParams({
      fromObject: {
        lat: this.parseCoordinate(lat, 'lat'),
        lon: this.parseCoordinate(lon, 'lon'),
        radius: this.parsePositiveNumber(radius, 'radius'),
        limit: this.parsePositiveInteger(limit, 'limit')
      }
    });

    return this.http
      .get<NearbyPlaceApiItem[] | NearbyPlacesApiResponse>(`${this.baseUrl}/places/nearby`, { params })
      .pipe(map((response) => this.normalizeNearbyPlaces(response)));
  }

  getLocalNearbyPlaces(
    lat: number | string,
    lon: number | string,
    radius: number | string = 250,
    limit: number | string = 15
  ): Observable<LocalNearbyPlace[]> {
    const params = new HttpParams({
      fromObject: {
        lat: this.parseCoordinate(lat, 'lat'),
        lon: this.parseCoordinate(lon, 'lon'),
        radius: this.parseBoundedNumber(radius, 'radius', 5000),
        limit: this.parseBoundedInteger(limit, 'limit', 50)
      }
    });

    return this.http
      .get<LocalNearbyPlacesApiResponse>(`${this.baseUrl}/places/local-nearby`, { params })
      .pipe(map((response) => this.normalizeLocalNearbyPlaces(response)));
  }

  getWeatherRegions(): Observable<WeatherRegion[]> {
    return this.http
      .get<WeatherRegionApiItem[] | WeatherRegionsApiResponse>(`${this.baseUrl}/weather-regions`)
      .pipe(map((response) => this.normalizeWeatherRegions(response)));
  }

  private parseCoordinate(value: number | string, label: 'lat' | 'lon'): string {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value.trim());

    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid ${label} coordinate: ${value}`);
    }

    return parsed.toString();
  }

  private parsePositiveNumber(value: number | string, label: string): string {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value.trim());

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Invalid ${label}: ${value}`);
    }

    return parsed.toString();
  }

  private parsePositiveInteger(value: number | string, label: string): string {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value.trim());

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`Invalid ${label}: ${value}`);
    }

    return parsed.toString();
  }

  private parseBoundedNumber(value: number | string, label: string, max: number): string {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value.trim());

    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > max) {
      throw new Error(`Invalid ${label}: ${value}`);
    }

    return parsed.toString();
  }

  private parseBoundedInteger(value: number | string, label: string, max: number): string {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value.trim());

    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > max) {
      throw new Error(`Invalid ${label}: ${value}`);
    }

    return parsed.toString();
  }

  private parseDate(value: string): string {
    const trimmed = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new Error(`Invalid date: ${value}`);
    }

    return trimmed;
  }

  private normalizeWeather(response: WeatherApiResponse): WeatherResponse {
    return {
      ...response,
      region_id: response.region_id ?? null,
      source: typeof response.source === 'string' ? response.source : null,
      now: this.normalizeWeatherForecast(response.now),
      plus_1_hour: this.normalizeWeatherForecast(response.plus_1_hour)
    };
  }

  private normalizeWeatherForecast(forecast: Record<string, unknown> | null | undefined): WeatherForecast {
    const source = forecast ?? {};

    return {
      ...source,
      forecast_for: this.readNullableString(source, 'forecast_for'),
      condition: this.readNullableString(source, 'condition'),
      intensity: this.readNullableString(source, 'intensity'),
      temperature_c: this.readNullableNumber(source, 'temperature_c'),
      feels_like_c: this.readNullableNumber(source, 'feels_like_c'),
      wind_m_s: this.readNullableNumber(source, 'wind_m_s'),
      gusts_m_s: this.readNullableNumber(source, 'gusts_m_s'),
      visibility_m: this.readNullableNumber(source, 'visibility_m'),
      fog: this.readNullableBoolean(source, 'fog'),
      snow: this.readNullableBoolean(source, 'snow'),
      precipitation_mm: this.readNullableNumber(source, 'precipitation_mm'),
      precipitation_probability: this.readNullableNumber(source, 'precipitation_probability'),
      thunder_probability: this.readNullableNumber(source, 'thunder_probability'),
      confidence: this.readNullableNumber(source, 'confidence'),
      confidence_reason: this.readNullableStringArray(source, 'confidence_reason')
    };
  }

  private readNullableString(source: Record<string, unknown>, key: string): string | null {
    const value = source[key];
    return typeof value === 'string' ? value : null;
  }

  private readNullableNumber(source: Record<string, unknown>, key: string): number | null {
    const value = source[key];
    return typeof value === 'number' ? value : null;
  }

  private readNullableBoolean(source: Record<string, unknown>, key: string): boolean | null {
    const value = source[key];
    return typeof value === 'boolean' ? value : null;
  }

  private readNullableStringArray(source: Record<string, unknown>, key: string): string[] | null {
    const value = source[key];

    if (!Array.isArray(value)) {
      return null;
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private normalizeNearbyPlaces(
    response: NearbyPlaceApiItem[] | NearbyPlacesApiResponse
  ): NearbyPlace[] {
    const places = Array.isArray(response)
      ? response
      : response.places ?? response.results ?? response.items ?? [];

    return places.map((place) => ({
      osm_id: place.osm_id ?? null,
      osm_type: place.osm_type ?? null,
      name: place.name ?? 'Unnamed place',
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
      category: place.category ?? null,
      subcategory: place.subcategory ?? null,
      address: place.address ?? null,
      distance_meters: place.distance_meters ?? null
    }));
  }

  private normalizeLocalNearbyPlaces(response: LocalNearbyPlacesApiResponse): LocalNearbyPlace[] {
    const places = response.places ?? [];

    return places.map((place) => ({
      id: place.id ?? null,
      name: place.name ?? 'Unnamed place',
      city: place.city ?? null,
      area: place.area ?? null,
      category: place.category ?? null,
      experience_kind: place.experience_kind ?? null,
      description: place.description ?? null,
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
      address: place.address ?? null,
      is_always_open: place.is_always_open ?? null,
      opening_hours_raw: place.opening_hours_raw ?? null,
      hours_note: place.hours_note ?? null,
      mood_tags: place.mood_tags ?? null,
      weather_tags: place.weather_tags ?? null,
      time_of_day_tags: place.time_of_day_tags ?? null,
      season_tags: place.season_tags ?? null,
      best_months: place.best_months ?? null,
      distance_meters: place.distance_meters ?? null
    }));
  }

  private normalizeWeatherRegions(
    response: WeatherRegionApiItem[] | WeatherRegionsApiResponse
  ): WeatherRegion[] {
    const regions = Array.isArray(response)
      ? response
      : response.regions ?? response.items ?? response.weather_regions ?? [];

    return regions
      .map((region) => {
        const regionId = this.readNullableString(region, 'region_id');

        if (!regionId) {
          return null;
        }

        return {
          region_id: regionId,
          area_slug: this.readNullableString(region, 'area_slug'),
          center_lat: this.readNullableNumber(region, 'center_lat'),
          center_lon: this.readNullableNumber(region, 'center_lon'),
          boundary: this.normalizeWeatherRegionBoundary(region.boundary)
        };
      })
      .filter((region): region is WeatherRegion => region !== null);
  }

  private normalizeWeatherRegionBoundary(
    boundary: WeatherRegionApiItem['boundary']
  ): WeatherRegion['boundary'] {
    const coordinates = boundary?.coordinates;

    if (!Array.isArray(coordinates)) {
      return null;
    }

    const normalizedCoordinates = coordinates
      .map((ring) => {
        if (!Array.isArray(ring)) {
          return [];
        }

        return ring.filter(
          (point): point is number[] =>
            Array.isArray(point) &&
            point.length >= 2 &&
            typeof point[0] === 'number' &&
            typeof point[1] === 'number'
        );
      })
      .filter((ring) => ring.length > 0);

    if (normalizedCoordinates.length === 0) {
      return null;
    }

    return {
      coordinates: normalizedCoordinates
    };
  }
}
