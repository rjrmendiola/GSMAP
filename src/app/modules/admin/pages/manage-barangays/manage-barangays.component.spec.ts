import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageBarangaysComponent } from './manage-barangays.component';

describe('ManageBarangaysComponent', () => {
  let component: ManageBarangaysComponent;
  let fixture: ComponentFixture<ManageBarangaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageBarangaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageBarangaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
