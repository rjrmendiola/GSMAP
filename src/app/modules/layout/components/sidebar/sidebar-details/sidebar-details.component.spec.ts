import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarDetailsComponent } from './sidebar-details.component';

describe('SidebarDetailsComponent', () => {
  let component: SidebarDetailsComponent;
  let fixture: ComponentFixture<SidebarDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
