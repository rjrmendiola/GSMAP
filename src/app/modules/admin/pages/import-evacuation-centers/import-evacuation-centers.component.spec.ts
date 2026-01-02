import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportEvacuationCentersComponent } from './import-evacuation-centers.component';

describe('ImportEvacuationCentersComponent', () => {
  let component: ImportEvacuationCentersComponent;
  let fixture: ComponentFixture<ImportEvacuationCentersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportEvacuationCentersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportEvacuationCentersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
