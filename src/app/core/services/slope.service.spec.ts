import { TestBed } from '@angular/core/testing';

import { SlopeService } from './slope.service';

describe('SlopeService', () => {
  let service: SlopeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlopeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
