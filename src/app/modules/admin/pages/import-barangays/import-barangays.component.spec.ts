import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportBarangaysComponent } from './import-barangays.component';

describe('ImportBarangaysComponent', () => {
  let component: ImportBarangaysComponent;
  let fixture: ComponentFixture<ImportBarangaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportBarangaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportBarangaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
