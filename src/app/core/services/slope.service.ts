import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SlopeService {
  private apiUrl = `${environment.apiUrl}/slopes`;

  constructor(private http: HttpClient) { }

  getSlopeGeoJson(): Observable<any> {
    return this.http.get(this.apiUrl+'/geojson'); // returns GeoJSON
  }
}
