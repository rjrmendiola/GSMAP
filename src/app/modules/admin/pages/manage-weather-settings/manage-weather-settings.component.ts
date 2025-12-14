import { Component, OnInit } from '@angular/core';
import { WeatherSettingsService } from 'src/app/core/services/weather-settings.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manage-weather-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-weather-settings.component.html',
  styleUrl: './manage-weather-settings.component.scss'
})
export class ManageWeatherSettingsComponent implements OnInit {
  form: FormGroup;
  loading = false;
  message = '';

  constructor(private fb: FormBuilder, private svc: WeatherSettingsService) {
    this.form = this.fb.group({
      refresh_interval_minutes: [30, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.svc.getSetting().subscribe(res => {
      if (res && res.data) {
        this.form.patchValue({ refresh_interval_minutes: res.data.refresh_interval_minutes });
      }
    });
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    this.svc.updateSetting(this.form.value.refresh_interval_minutes).subscribe({
      next: (r) => { this.message = 'Saved.'; this.loading = false; },
      error: (e) => { this.message = 'Failed to save.'; console.error(e); this.loading = false; }
    });
  }
}
