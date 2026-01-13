import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Barangay, BarangayProfile } from 'src/app/shared/models/barangay.model';

export interface SelectedBarangayData {
  barangay: Barangay;
  barangayProfile: BarangayProfile | null;
  chairman: any;
  nearestEvacuationCenters: any[];
}

@Injectable({
  providedIn: 'root'
})
export class BarangaySelectionService {
  private selectedBarangaySource = new BehaviorSubject<SelectedBarangayData | null>(null);
  selectedBarangayData$ = this.selectedBarangaySource.asObservable();

  private hoveredBarangayNameSource = new BehaviorSubject<string | null>(null);
  hoveredBarangayName$ = this.hoveredBarangayNameSource.asObservable();

  setSelectedBarangay(data: SelectedBarangayData) {
    this.selectedBarangaySource.next(data);
  }

  clearSelection() {
    this.selectedBarangaySource.next(null);
  }

  setHoveredBarangay(name: string | null) {
    this.hoveredBarangayNameSource.next(name);
  }

  getSelectedBarangayData() {
    return this.selectedBarangaySource.value;
  }
}
