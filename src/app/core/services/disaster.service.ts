import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DisasterService {
  private disasterTypeSource = new BehaviorSubject<{ type: string; category?: string } | null>(null);
  disasterType$ = this.disasterTypeSource.asObservable();

  setDisasterType(disasterType: { type: string; category?: string }) {
    this.disasterTypeSource.next(disasterType);
  }

  clearDisasterType() {
    this.disasterTypeSource.next(null);
  }

  getDisasterType() {
    return this.disasterTypeSource.asObservable();
  }
}
