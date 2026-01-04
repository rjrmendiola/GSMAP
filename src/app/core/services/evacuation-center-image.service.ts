import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvacuationCenterImageService {
  private baseUrl = `${environment.apiUrl}/evacuationcenters`;

  constructor(private http: HttpClient) {}

  uploadImage(evacuationCenterId: number, file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('evacuation_center_id', evacuationCenterId.toString());

    const req = new HttpRequest(
      'POST',
      `${this.baseUrl}/upload-image`,
      formData,
      {
        reportProgress: true
      }
    );

    return this.http.request(req);
  }

  getImages(evacuationCenterId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/${evacuationCenterId}/images`);
  }

  deleteImage(imageId: number) {
    return this.http.delete(`${this.baseUrl}/image/${imageId}`);
  }

  setPrimary(evacuationCenterId: number, imageId: number) {
    return this.http.post(`${this.baseUrl}/${evacuationCenterId}/set-primary`, { image_id: imageId });
  }

  uploadImages(evacuationCenterId: number, formData: FormData) {
    return this.http.post(`${this.baseUrl}/${evacuationCenterId}/images`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
