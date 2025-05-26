import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageOfficialsComponent } from './manage-officials.component';

describe('ManageOfficialsComponent', () => {
  let component: ManageOfficialsComponent;
  let fixture: ComponentFixture<ManageOfficialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageOfficialsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageOfficialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
