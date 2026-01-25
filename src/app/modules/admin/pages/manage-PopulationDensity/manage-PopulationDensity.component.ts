import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Barangay } from 'src/app/shared/models/barangay.model';
import { RouterModule } from '@angular/router';

// Interface for Population Data
export interface PopulationDensity {
  id?: number;
  barangay_id: number;
  population_count: number;
  land_area_sq_km: number;
  density?: number; // Usually calculated as population / area
}

@Component({
  selector: 'app-population-density',
  standalone: true,
  imports: [AngularSvgIconModule, CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './population-density.component.html',
  styleUrl: './population-density.component.scss'
})
export class PopulationDensityComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  densities: PopulationDensity[] = [];
  barangays: Barangay[] = [];
  isEditing = false;
  selectedId: number | null = null;
  isModalOpen = false;

  // Form updated for Population metrics
  densityForm = this.fb.group({
    barangay_id: [null as number | null, Validators.required],
    population_count: [null as number | null, [Validators.required, Validators.min(0)]],
    land_area_sq_km: [null as number | null, [Validators.required, Validators.min(0.0001)]],
  });

  searchQuery = '';
  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.fetchBarangays();
    this.fetchDensities();
  }

  fetchBarangays() {
    this.http.get<any>(`${environment.apiUrl}/barangays`).subscribe(response => {
      this.barangays = response.barangays || [];
    });
  }

  fetchDensities() {
    const params = {
      page: this.page.toString(),
      limit: this.limit.toString(),
      search: this.searchQuery
    };

    this.http.get<any>(`${environment.apiUrl}/population-density`, { params }).subscribe(response => {
      this.densities = response.data || []; // Adjust based on your API's key (e.g., 'densities' or 'data')
      this.total = response.total || 0;
    });
  }

  openModal(record?: PopulationDensity) {
    this.isEditing = !!record;
    this.selectedId = record?.id ?? null;

    this.densityForm.reset({
      barangay_id: record?.barangay_id ? Number(record.barangay_id) : null,
      population_count: record?.population_count ?? null,
      land_area_sq_km: record?.land_area_sq_km ?? null
    });

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.densityForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSubmit() {
    if (this.densityForm.invalid) return;

    const payload = this.densityForm.value;
    const url = `${environment.apiUrl}/population-density`;

    if (this.isEditing && this.selectedId !== null) {
      this.http.put(`${url}/${this.selectedId}`, payload).subscribe(() => {
        this.fetchDensities();
        this.closeModal();
      });
    } else {
      this.http.post(url, payload).subscribe(() => {
        this.fetchDensities();
        this.closeModal();
      });
    }
  }

  onDelete(id: number) {
    if (!confirm('Delete this population record?')) return;
    this.http.delete(`${environment.apiUrl}/population-density/${id}`).subscribe(() => {
      this.fetchDensities();
    });
  }

  onSearch() {
    this.page = 1;
    this.fetchDensities();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchDensities();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  getBarangayName(id: number): string {
    return this.barangays.find(b => b.id === id)?.name || 'Unknown';
  }

  // --- Pagination UI Helpers ---
  get pageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      if (this.page <= 4) pages.push(1, 2, 3, 4, 5, '...', this.totalPages);
      else if (this.page >= this.totalPages - 3) pages.push(1, '...', this.totalPages - 4, this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages);
      else pages.push(1, '...', this.page - 1, this.page, this.page + 1, '...', this.totalPages);
    }
    return pages;
  }

  handlePageClick(p: number | string) {
    if (p !== '...') this.onPageChange(p as number);
  }
}