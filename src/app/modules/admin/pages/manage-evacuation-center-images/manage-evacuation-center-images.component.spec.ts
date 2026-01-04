import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEvacuationCenterImagesComponent } from './manage-evacuation-center-images.component';

describe('ManageEvacuationCenterImagesComponent', () => {
  let component: ManageEvacuationCenterImagesComponent;
  let fixture: ComponentFixture<ManageEvacuationCenterImagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageEvacuationCenterImagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageEvacuationCenterImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
