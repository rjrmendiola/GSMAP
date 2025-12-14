import { TestBed } from '@angular/core/testing';

import { HazardDetectorService } from './hazard-detector.service';

describe('HazardDetectorService', () => {
  let service: HazardDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HazardDetectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
