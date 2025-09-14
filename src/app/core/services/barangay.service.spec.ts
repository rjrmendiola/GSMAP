import { TestBed } from '@angular/core/testing';

import { BarangayService } from './barangay.service';

describe('BarangayService', () => {
  let service: BarangayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarangayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
