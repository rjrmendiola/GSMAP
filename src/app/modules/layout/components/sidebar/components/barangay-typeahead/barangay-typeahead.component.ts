import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BarangayService } from 'src/app/core/services/barangay.service';
import { Barangay } from 'src/app/shared/models/barangay.model';

@Component({
  selector: 'app-barangay-typeahead',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './barangay-typeahead.component.html',
  styleUrl: './barangay-typeahead.component.scss'
})
export class BarangayTypeaheadComponent implements OnInit {

  query = '';
  barangays: Barangay[] = [];
  filtered: Barangay[] = [];
  showList = false;

  constructor(
    private barangayService: BarangayService
  ) {}

  ngOnInit(): void {
    // Subscribe once to shared barangay list
    this.barangayService.barangays$.subscribe(data => {
      this.barangays = data;
    });
  }

  onInput(): void {
    const q = this.query.toLowerCase().trim();

    if (!q) {
      this.showList = false;
      return;
    }

    this.filtered = this.barangays.filter(b =>
      b.name.toLowerCase().includes(q)
    );

    this.showList = this.filtered.length > 0;
  }

  select(barangay: Barangay): void {
    this.query = barangay.name;
    this.showList = false;

    // THIS is the important part
    this.barangayService.selectBarangay(barangay);
  }

  clear(): void {
    this.query = '';
    this.showList = false;
    this.barangayService.selectBarangay(null as any);
  }
}
