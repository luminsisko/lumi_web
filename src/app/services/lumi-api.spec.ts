import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AstronomyResponse, LumiApi, NearbyPlace, WeatherResponse } from './lumi-api';

describe('LumiApi', () => {
  let service: LumiApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(LumiApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send normalized numeric query params for weather', () => {
    service.getWeather('60.1699', '24.9384').subscribe();

    const request = httpTesting.expectOne((req) => req.url === '/api/weather');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('lat')).toBe('60.1699');
    expect(request.request.params.get('lon')).toBe('24.9384');

    request.flush({
      temperature: 5.2,
      windspeed: 15.1,
      weathercode: 0
    });
  });

  it('should normalize flat weather responses into the UI model', () => {
    let actual: WeatherResponse | null = null;

    service.getWeather(60.1699, 24.9384).subscribe((response) => {
      actual = response;
    });

    const request = httpTesting.expectOne('/api/weather?lat=60.1699&lon=24.9384');

    request.flush({
      temperature: 5.2,
      windspeed: 15.1,
      weathercode: 0
    });

    expect(actual).toEqual({
      timezone: null,
      current: {
        time: null,
        temperature_2m: 5.2,
        apparent_temperature: 5.2,
        precipitation: null,
        rain: null,
        showers: null,
        snowfall: null,
        cloud_cover: 0,
        wind_speed_10m: 15.1
      },
      sunrise: null,
      sunset: null
    });
  });

  it('should reject invalid weather coordinates before the request is sent', () => {
    expect(() => service.getWeather('north', '24.9384')).toThrowError(
      'Invalid lat coordinate: north'
    );
    httpTesting.expectNone('/api/weather');
  });

  it('should send normalized query params for astronomy', () => {
    service.getAstronomy('65.01', '25.47', '2026-03-22').subscribe();

    const request = httpTesting.expectOne((req) => req.url === '/api/astronomy');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('lat')).toBe('65.01');
    expect(request.request.params.get('lon')).toBe('25.47');
    expect(request.request.params.get('date')).toBe('2026-03-22');

    request.flush({});
  });

  it('should return astronomy responses as-is', () => {
    let actual: AstronomyResponse | null = null;

    service.getAstronomy(65.01, 25.47, '2026-03-22').subscribe((response) => {
      actual = response;
    });

    const request = httpTesting.expectOne('/api/astronomy?lat=65.01&lon=25.47&date=2026-03-22');

    request.flush({
      sunrise: '06:22',
      sunset: '18:41',
      moon: {
        phase: 'waxing crescent'
      }
    });

    expect(actual).toEqual({
      sunrise: '06:22',
      sunset: '18:41',
      moon: {
        phase: 'waxing crescent'
      }
    });
  });

  it('should reject invalid astronomy dates before the request is sent', () => {
    expect(() => service.getAstronomy('65.01', '25.47', '22-03-2026')).toThrowError(
      'Invalid date: 22-03-2026'
    );
    httpTesting.expectNone('/api/astronomy');
  });

  it('should send normalized numeric query params for nearby places', () => {
    service.getNearbyPlaces('60.1699', '24.9384', '500', '10').subscribe();

    const request = httpTesting.expectOne((req) => req.url === '/api/places/nearby');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('lat')).toBe('60.1699');
    expect(request.request.params.get('lon')).toBe('24.9384');
    expect(request.request.params.get('radius')).toBe('500');
    expect(request.request.params.get('limit')).toBe('10');

    request.flush([]);
  });

  it('should use the default nearby places radius and limit when none is provided', () => {
    service.getNearbyPlaces(60.1699, 24.9384).subscribe();

    const request = httpTesting.expectOne(
      '/api/places/nearby?lat=60.1699&lon=24.9384&radius=250&limit=20'
    );

    request.flush([]);
  });

  it('should normalize wrapped nearby places responses into the UI model', () => {
    let actual: NearbyPlace[] = [];

    service.getNearbyPlaces(60.1699, 24.9384).subscribe((response) => {
      actual = response;
    });

    const request = httpTesting.expectOne(
      '/api/places/nearby?lat=60.1699&lon=24.9384&radius=250&limit=20'
    );

    request.flush({
      places: [
        {
          osm_id: 123,
          osm_type: 'node',
          name: 'Cafe Esplanad',
          latitude: 60.1675,
          longitude: 24.9476,
          category: 'amenity',
          subcategory: 'cafe',
          address: 'Pohjoisesplanadi 37, 00100, Helsinki',
          distance_meters: 12
        }
      ]
    });

    expect(actual).toEqual([
      {
        osm_id: 123,
        osm_type: 'node',
        name: 'Cafe Esplanad',
        latitude: 60.1675,
        longitude: 24.9476,
        category: 'amenity',
        subcategory: 'cafe',
        address: 'Pohjoisesplanadi 37, 00100, Helsinki',
        distance_meters: 12
      }
    ]);
  });

  it('should reject invalid nearby place coordinates before the request is sent', () => {
    expect(() => service.getNearbyPlaces('north', '24.9384')).toThrowError(
      'Invalid lat coordinate: north'
    );
    httpTesting.expectNone('/api/places/nearby');
  });

  it('should reject invalid nearby place radius before the request is sent', () => {
    expect(() => service.getNearbyPlaces('60.1699', '24.9384', 'zero')).toThrowError(
      'Invalid radius: zero'
    );
    httpTesting.expectNone('/api/places/nearby');
  });

  it('should reject invalid nearby place limit before the request is sent', () => {
    expect(() => service.getNearbyPlaces('60.1699', '24.9384', '250', '0')).toThrowError(
      'Invalid limit: 0'
    );
    httpTesting.expectNone('/api/places/nearby');
  });
});
