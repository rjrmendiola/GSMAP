import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

export interface Barangay {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  // add other fields if your API returns more (e.g., geojson, population, etc.)
}

export interface BarangayResponse {
  total: number;
  page: number;
  limit: number;
  barangays: Barangay[];
}

@Injectable({
  providedIn: 'root'
})
export class BarangayService {
  private apiUrl = `${environment.apiUrl}/barangays`;

  constructor(private http: HttpClient) {}

  getAllBarangays(): Observable<Barangay[]> {
    return this.http.get<Barangay[]>(this.apiUrl+'?all=true');
  }

  // getBarangays(): Observable<Barangay[]> {
  //   return this.http.get<Barangay[]>(this.apiUrl);
  // }
  getBarangays(page: number = 1, limit: number = 10): Observable<BarangayResponse> {
    return this.http.get<BarangayResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  createBarangay(barangay: Partial<Barangay>): Observable<Barangay> {
    return this.http.post<Barangay>(this.apiUrl, barangay);
  }

  // Shared state for DSS / map interaction
  private barangaysSource = new BehaviorSubject<Barangay[]>([]);
  barangays$ = this.barangaysSource.asObservable();

  private selectedBarangaySource = new BehaviorSubject<Barangay | null>(null);
  selectedBarangay$ = this.selectedBarangaySource.asObservable();

  setBarangays(barangays: Barangay[]): void {
    this.barangaysSource.next(barangays);
  }

  selectBarangay(barangay: Barangay): void {
    this.selectedBarangaySource.next(barangay);
  }
}
