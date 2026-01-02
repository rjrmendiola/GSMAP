import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportBarangayOfficialsComponent } from './import-barangay-officials.component';

describe('ImportBarangayOfficialsComponent', () => {
  let component: ImportBarangayOfficialsComponent;
  let fixture: ComponentFixture<ImportBarangayOfficialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportBarangayOfficialsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportBarangayOfficialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
