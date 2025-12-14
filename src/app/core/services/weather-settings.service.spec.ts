import { TestBed } from '@angular/core/testing';

import { WeatherSettingsService } from './weather-settings.service';

describe('WeatherSettingsService', () => {
  let service: WeatherSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeatherSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
