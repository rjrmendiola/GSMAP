import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageWeatherSettingsComponent } from './manage-weather-settings.component';

describe('ManageWeatherSettingsComponent', () => {
  let component: ManageWeatherSettingsComponent;
  let fixture: ComponentFixture<ManageWeatherSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageWeatherSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageWeatherSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
