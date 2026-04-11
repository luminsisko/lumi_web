import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LumiApi, NearbyPlace, WeatherResponse } from './lumi-api';

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
