import { TestBed } from '@angular/core/testing';

import { SoilMoistureService } from './soil-moisture.service';

describe('SoilMoistureService', () => {
  let service: SoilMoistureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoilMoistureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
