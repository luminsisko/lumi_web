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
  id?: string | number | null;
  name: string;
  category: string | null;
  area: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface WeatherResponse {
  timezone: string | null;
  current: {
    time: string | null;
    temperature_2m: number | null;
    apparent_temperature: number | null;
    precipitation: number | null;
    rain: number | null;
    showers: number | null;
    snowfall: number | null;
    cloud_cover: number | null;
    wind_speed_10m: number | null;
  };
  sunrise: string | null;
  sunset: string | null;
}

interface WeatherApiResponse {
  timezone?: string | null;
  current?: Partial<WeatherResponse['current']> | null;
  sunrise?: string | null;
  sunset?: string | null;
  temperature?: number | null;
  windspeed?: number | null;
  weathercode?: number | null;
}

interface NearbyPlaceApiItem {
  id?: string | number | null;
  name?: string | null;
  category?: string | null;
  type?: string | null;
  area?: string | null;
  district?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lon?: number | null;
  lng?: number | null;
  address?: string | null;
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

  getNearbyPlaces(lat: number | string, lon: number | string): Observable<NearbyPlace[]> {
    const params = new HttpParams({
      fromObject: {
        lat: this.parseCoordinate(lat, 'lat'),
        lon: this.parseCoordinate(lon, 'lon')
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

  private normalizeWeather(response: WeatherApiResponse): WeatherResponse {
    const current = response.current ?? {};

    return {
      timezone: response.timezone ?? null,
      current: {
        time: current.time ?? null,
        temperature_2m: current.temperature_2m ?? response.temperature ?? null,
        apparent_temperature: current.apparent_temperature ?? response.temperature ?? null,
        precipitation: current.precipitation ?? null,
        rain: current.rain ?? null,
        showers: current.showers ?? null,
        snowfall: current.snowfall ?? null,
        cloud_cover: current.cloud_cover ?? response.weathercode ?? null,
        wind_speed_10m: current.wind_speed_10m ?? response.windspeed ?? null
      },
      sunrise: response.sunrise ?? null,
      sunset: response.sunset ?? null
    };
  }

  private normalizeNearbyPlaces(
    response: NearbyPlaceApiItem[] | NearbyPlacesApiResponse
  ): NearbyPlace[] {
    const places = Array.isArray(response)
      ? response
      : response.places ?? response.results ?? response.items ?? [];

    return places.map((place) => ({
      id: place.id ?? null,
      name: place.name ?? 'Unnamed place',
      category: place.category ?? place.type ?? null,
      area: place.area ?? place.district ?? null,
      description: place.description ?? null,
      latitude: place.latitude ?? place.lat ?? null,
      longitude: place.longitude ?? place.lng ?? place.lon ?? null,
      address: place.address ?? null
    }));
  }
}
