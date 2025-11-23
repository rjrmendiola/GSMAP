import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DssFilterComponent } from './dss-filter.component';

describe('DssFilterComponent', () => {
  let component: DssFilterComponent;
  let fixture: ComponentFixture<DssFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DssFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DssFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
