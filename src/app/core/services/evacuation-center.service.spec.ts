import { TestBed } from '@angular/core/testing';

import { EvacuationCenterService } from './evacuation-center.service';

describe('EvacuationCenterService', () => {
  let service: EvacuationCenterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvacuationCenterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
