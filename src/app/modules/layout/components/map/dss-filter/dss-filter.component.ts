import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MapTypeService } from 'src/app/core/services/maptype.service';
import { Barangay } from 'src/app/shared/models/barangay.model';

@Component({
  selector: 'app-dss-filter',
  standalone: true,
  imports: [FormsModule, NgFor],
  templateUrl: './dss-filter.component.html',
  styleUrl: './dss-filter.component.scss'
})
export class DssFilterComponent {
  @Input() barangays: Barangay[] = [];
  @Input() baseLayerTypes: { label: string, value: string }[] = [];
  @Input() selectedFlood: string | null = null;
  @Input() selectedLandslide: string | null = null;
  @Input() selectedBarangay: string = 'all'
  @Input() selectedMapType: string = '';
  @Input() isOpen: boolean = false;
  @Output() applyFilters = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  // selectedFlood: string | null = null;
  // selectedLandslide: string | null = null;
  // selectedBarangay: string = 'all';
  // selectedMapType: string = '';

  constructor(
    public mapTypeService: MapTypeService
  ) {}

  onFloodSelected(value: string) {
    this.selectedFlood = value;
    this.selectedLandslide = null; // clear landslide when flood is chosen
  }

  onLandslideSelected(value: string) {
    this.selectedLandslide = value;
    this.selectedFlood = null; // clear flood when landslide is chosen
  }

  onSelectBarangay(event: any) {
    this.selectedBarangay = event.target.value;
  }

  onSelectMapType(event: any) {
    this.selectedMapType = event.target.value;
    // this.mapTypeService.setMapType(event);
  }

  apply() {
    this.applyFilters.emit({
      flood: this.selectedFlood,
      landslide: this.selectedLandslide,
      barangay: this.selectedBarangay,
      mapType: this.selectedMapType,
    });

    this.closeModal.emit();
  }

  onCloseModalClick() {
    this.closeModal.emit();
  }
}
