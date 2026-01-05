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
  @Input() selectedBarangays: number[] = [];
  @Input() selectedMapType: string = '';
  @Input() isOpen: boolean = false;
  @Output() applyFilters = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();
  // @Output() barangaysSelected = new EventEmitter<string[]>();

  private hazardAffectedBarangays = {
    'landslide': {
      // 'unlikely': "Areas have minimal susceptibility, characterized by stable terrain, gentle slopes, and solid ground, where landslides are rare under typical conditions",
      'less_likely_to_experience': [
        'tinaguban', 'hiluctugan', 'canlampay', 'libo', 'upper_hiraan', 'caghalo', 'manloy', 'san_isidro', 'paglaum', 'camansi'
      ],
      'moderately_susceptible': [
        'tinaguban', 'hiluctugan', 'canlampay', 'libo', 'upper_hiraan', 'caghalo', 'manloy', 'san_isidro', 'paglaum', 'camansi'
      ],
      'highly_susceptible': [
        'caghalo', 'paglaum', 'san_isidro', 'tinaguban', 'libo'
      ]
    },
    'typhoon': {
      'tropical_depression': [
        'san_mateo', 'guindapunan_west', 'guindapunan_east', 'jugaban', 'balilit', 'barugohay_sur', 'cutay', 'bislig', 'barayong', 'manloy', 'barugohay_central', 'nauguisan', 'canal'
      ],
      'tropical_storm': [
        'san_mateo', 'guindapunan_west', 'guindapunan_east', 'jugaban', 'balilit', 'barugohay_sur', 'cutay', 'bislig', 'barayong', 'manloy', 'barugohay_central', 'nauguisan', 'canal'
      ],
      'severe_tropical_storm': [
        'tangnan', 'nauguisan', 'san_juan', 'west_visoria', 'east_visoria', 'ponong', 'baybay', 'jugaban', 'canal', 'uyawan', 'tagak', 'rizal', 'sagkahan', 'pangna', 'bislig'
      ],
      'typhoon': [
        'tangnan', 'nauguisan', 'san_juan', 'west_visoria', 'east_visoria', 'ponong', 'baybay', 'jugaban', 'canal', 'uyawan', 'tagak', 'rizal', 'sagkahan', 'pangna', 'bislig'
      ],
      'super_typhoon': [
        'bislig', 'canal', 'uyawan', 'lower_hiraan', 'canlampay', 'parena', 'upper_sogod', 'lower_sogod', 'binibihan', 'macalpi'
      ]
    }
  };

  // selectedBarangays: number[] = [];

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

    var floodCategoryMap: any = {
      'category5': this.hazardAffectedBarangays.typhoon.super_typhoon,
      'category4': this.hazardAffectedBarangays.typhoon.typhoon,
      'category3': this.hazardAffectedBarangays.typhoon.severe_tropical_storm,
      'category2': this.hazardAffectedBarangays.typhoon.tropical_storm,
      'category1': this.hazardAffectedBarangays.typhoon.tropical_depression,
    };

    var floodAffectedBarangaySlugs = floodCategoryMap[value];
    var floodAffectedBarangays = [];

    for (const barangay_slug of floodAffectedBarangaySlugs) {
      const barangay = this.barangays.find(b => b.slug === barangay_slug);
      if (barangay) {
        floodAffectedBarangays.push(barangay!.id);
      }
    }

    this.selectedBarangays = floodAffectedBarangays;
  }

  onLandslideSelected(value: string) {
    this.selectedLandslide = value;
    this.selectedFlood = null; // clear flood when landslide is chosen

    var landslideCategoryMap: any = {
      'category4': this.hazardAffectedBarangays.landslide.highly_susceptible,
      'category3': this.hazardAffectedBarangays.landslide.moderately_susceptible,
      // 'category2': this.hazardAffectedBarangays.landslide.unlikely,
      'category1': this.hazardAffectedBarangays.landslide.less_likely_to_experience,
    };

    var landslideAffectedBarangaySlugs = landslideCategoryMap[value];
    var landslideAffectedBarangays = [];

    for (const barangay_slug of landslideAffectedBarangaySlugs) {
      const barangay = this.barangays.find(b => b.slug === barangay_slug);
      if (barangay) {
        landslideAffectedBarangays.push(barangay!.id);
      }
    }

    this.selectedBarangays = landslideAffectedBarangays;
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
      barangays: [...this.selectedBarangays]
    });

    this.closeModal.emit();
  }

  onCloseModalClick() {
    this.closeModal.emit();
  }

  clearSelection(category: string, type: string) {
    if (category === 'flood') {
      if (this.selectedFlood === type) {
        this.selectedFlood = null;
      } else {
        this.selectedFlood = type;
      }
    } else if (category === 'landslide') {
      if (this.selectedLandslide === type) {
        this.selectedLandslide = null;
      } else {
        this.selectedLandslide = type;
      }
    }

    this.selectedBarangays = [];
  }

  onBarangayToggle(barangay: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked; // cast to HTMLInputElement

    if (checked) {
      if (!this.selectedBarangays.includes(barangay)) {
        this.selectedBarangays.push(barangay);
      }
    } else {
      this.selectedBarangays = this.selectedBarangays.filter(b => b !== barangay);
    }

    // Emit to parent
    // this.barangaysSelected.emit(this.selectedBarangays);
  }

  ngOnChanges() {}
}
