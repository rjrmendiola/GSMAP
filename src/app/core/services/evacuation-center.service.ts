import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface EvacuationCenter {
  id: number;
  name: string;
  barangay: string;
  punong_barangay: string;
  latitude: number;
  longitude: number;
  venue: string;
  image: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvacuationCenterService {
  // private apiUrl = 'http://localhost:3000/api/evacuationcenters';
  private apiUrl = `${environment.apiUrl}/evacuationcenters`;

  constructor(private http: HttpClient) {}

  getEvacuationCenters(): Observable<EvacuationCenter[]> {
    return this.http.get<EvacuationCenter[]>(this.apiUrl);
  }
}
