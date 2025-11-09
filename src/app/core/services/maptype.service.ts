import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapTypeService {
  private mapTypeSource = new BehaviorSubject<{ type: string; } | null>(null);
  mapType$ = this.mapTypeSource.asObservable();

  setMapType(mapType: { type: string; }) {
    this.mapTypeSource.next(mapType);
  }
}
