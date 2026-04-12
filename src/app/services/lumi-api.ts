import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

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
  now: WeatherForecast;
  plus_1_hour: WeatherForecast;
}

interface WeatherApiResponse extends Record<string, unknown> {
  region_id?: string | null;
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

@Injectable({
  providedIn: 'root'
})
export class LumiApi {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  getHealth(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/health`);
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
      .pipe(map((response) => this.normalizeWeather(response)));
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

    return this.http.get<AstronomyResponse>(`${this.baseUrl}/astronomy`, { params });
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
}
