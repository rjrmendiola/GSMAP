import { TestBed } from '@angular/core/testing';

import { DisasterService } from './disaster.service';

describe('DisasterService', () => {
  let service: DisasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
