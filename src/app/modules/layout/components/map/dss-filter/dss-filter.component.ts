import { NgFor } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-dss-filter',
  standalone: true,
  imports: [NgFor],
  templateUrl: './dss-filter.component.html',
  styleUrl: './dss-filter.component.scss'
})
export class DssFilterComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<any>();

  floodSelections: any = {};
  landslideSelections: any = {};
  selectedBarangay: string = 'all';
  selectedMapType: string = '';

  barangays = [
    'Bagong Lipunan',
    'Balilit',
    'Barangay Central',
    'Barangay Norte',
    'Barangay Sur'
    // Add from your DB later
  ];

  onFloodChange(type: string, event: any) {
    this.floodSelections[type] = event.target.checked;
  }

  onLandslideChange(type: string, event: any) {
    this.landslideSelections[type] = event.target.checked;
  }

  onSelectBarangay(event: any) {
    this.selectedBarangay = event.target.value;
  }

  onSelectMapType(event: any) {
    this.selectedMapType = event.target.value;
  }

  apply() {
    this.applyFilters.emit({
      flood: this.floodSelections,
      landslide: this.landslideSelections,
      barangay: this.selectedBarangay,
      mapType: this.selectedMapType,
    });
  }

  close() {
    this.closeModal.emit();
  }
}
