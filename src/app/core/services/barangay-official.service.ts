import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Barangay } from './barangay.service';

export interface BarangayOfficial {
  id: number;
  name: string;
  position: string;
  barangay: Barangay;
}

@Injectable({
  providedIn: 'root'
})
export class BarangayOfficialService {
  // private apiUrl = 'http://localhost:3000/api/barangayofficials';
  private baseUrl = `${environment.apiUrl}/barangayofficials`;

  constructor(private http: HttpClient) {}

  getBarangayOfficials(): Observable<BarangayOfficial[]> {
    return this.http.get<BarangayOfficial[]>(this.baseUrl);
  }

  getAllBarangayOfficials(): Observable<BarangayOfficial[]> {
    return this.http.get<BarangayOfficial[]>(this.baseUrl+'?all=true');
  }

  getAll() {
    return this.http.get<BarangayOfficial[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<BarangayOfficial>(`${this.baseUrl}/${id}`);
  }

  create(center: Partial<BarangayOfficial>) {
    return this.http.post(this.baseUrl, center);
  }

  update(id: number, center: Partial<BarangayOfficial>) {
    return this.http.put(`${this.baseUrl}/${id}`, center);
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  importBarangayOfficials(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.baseUrl}/import`,
      formData
    );
  }
}
