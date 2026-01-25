import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportBarangayProfilesComponent } from './import-barangay-profiles.component';

describe('ImportBarangayProfilesComponent', () => {
  let component: ImportBarangayProfilesComponent;
  let fixture: ComponentFixture<ImportBarangayProfilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportBarangayProfilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportBarangayProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
