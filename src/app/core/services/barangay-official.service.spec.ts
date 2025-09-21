import { TestBed } from '@angular/core/testing';

import { BarangayOfficialService } from './barangay-official.service';

describe('BarangayOfficialService', () => {
  let service: BarangayOfficialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarangayOfficialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
