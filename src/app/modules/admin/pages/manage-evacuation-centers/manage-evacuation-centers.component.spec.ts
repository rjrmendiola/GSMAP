import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEvacuationCentersComponent } from './manage-evacuation-centers.component';

describe('ManageEvacuationCentersComponent', () => {
  let component: ManageEvacuationCentersComponent;
  let fixture: ComponentFixture<ManageEvacuationCentersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageEvacuationCentersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageEvacuationCentersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
