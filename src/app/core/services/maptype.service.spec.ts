import { TestBed } from '@angular/core/testing';

import { MapTypeService } from './maptype.service';

describe('MapTypeService', () => {
  let service: MapTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
