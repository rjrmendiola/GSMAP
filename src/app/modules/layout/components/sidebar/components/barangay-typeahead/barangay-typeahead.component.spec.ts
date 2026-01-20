import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarangayTypeaheadComponent } from './barangay-typeahead.component';

describe('BarangayTypeaheadComponent', () => {
  let component: BarangayTypeaheadComponent;
  let fixture: ComponentFixture<BarangayTypeaheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarangayTypeaheadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarangayTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
