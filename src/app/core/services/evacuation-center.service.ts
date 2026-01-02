import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface BarangayOfficial {
  id: number;
  name: string;
  position: string;
}

export interface EvacuationCenter {
  id: number;
  name: string;
  barangay_id: number;
  barangay: string;
  latitude: number;
  longitude: number;
  venue: string;
  image: string;
  created_at: string;
  updated_at: string;
  barangay_official: BarangayOfficial
}

@Injectable({
  providedIn: 'root'
})
export class EvacuationCenterService {
  // private apiUrl = 'http://localhost:3000/api/evacuationcenters';
  private baseUrl = `${environment.apiUrl}/evacuationcenters`;

  constructor(private http: HttpClient) {}

  getEvacuationCenters(): Observable<EvacuationCenter[]> {
    return this.http.get<EvacuationCenter[]>(this.baseUrl);
  }

  getAllEvacuationCenters(): Observable<EvacuationCenter[]> {
    return this.http.get<EvacuationCenter[]>(this.baseUrl+'?all=true');
  }

  getAll() {
    return this.http.get<EvacuationCenter[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<EvacuationCenter>(`${this.baseUrl}/${id}`);
  }

  create(center: Partial<EvacuationCenter>) {
    return this.http.post(this.baseUrl, center);
  }

  update(id: number, center: Partial<EvacuationCenter>) {
    return this.http.put(`${this.baseUrl}/${id}`, center);
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  importEvacuationCenters(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.baseUrl}/import`,
      formData
    );
  }
}
