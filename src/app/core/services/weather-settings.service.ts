import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface WeatherSetting {
  id?: number;
  refresh_interval_minutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherSettingsService {
  private apiUrl = `${environment.apiUrl}/weathersettings`;

  constructor(private http: HttpClient) {}

  getSetting(): Observable<{ success: boolean, data: WeatherSetting }> {
    return this.http.get<{ success: boolean, data: WeatherSetting }>(this.apiUrl);
  }

  updateSetting(minutes: number) {
    return this.http.put(this.apiUrl, { refresh_interval_minutes: minutes });
  }
}
