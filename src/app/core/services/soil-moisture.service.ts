import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SoilMoistureService {
  private apiUrl = `${environment.apiUrl}/soilmoistures`;

  constructor(private http: HttpClient) { }

  getSoilMoisturesGeoJson(): Observable<any> {
    return this.http.get(this.apiUrl+'/geojson'); // returns GeoJSON
  }
}
