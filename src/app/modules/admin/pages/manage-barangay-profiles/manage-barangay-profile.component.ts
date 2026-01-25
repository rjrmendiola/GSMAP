import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Barangay } from 'src/app/shared/models/barangay.model';
import { RouterModule } from '@angular/router';

// Interface for Barangay Profile
export interface BarangayProfile {
  id?: number;
  barangay_id: number;
  area: number;
  // population_density: number;
  population: number;
  livelihood: string;
  // land_area_sq_km: number;
  // density?: number; // Usually calculated as population / area
  max_slope: number;
  mean_slope: number;
}

@Component({
  selector: 'app-barangay-profile',
  standalone: true,
  imports: [AngularSvgIconModule, CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './manage-barangay-profile.component.html',
  styleUrl: './manage-barangay-profile.component.scss'
})
export class ManageBarangayProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  profiles: BarangayProfile[] = [];
  barangays: Barangay[] = [];
  isEditing = false;
  selectedId: number | null = null;
  isModalOpen = false;

  // Form
  profileForm = this.fb.group({
    barangay_id: [null as number | null, Validators.required],
    // population_count: [null as number | null, [Validators.required, Validators.min(0)]],
    // land_area_sq_km: [null as number | null, [Validators.required, Validators.min(0.0001)]],
    population: [null as number | null, [Validators.required, Validators.min(0)]],
    area: [null as number | null, [Validators.required, Validators.min(0.0001)]],
    livelihood: ["" as string],
    max_slope: [null as number | null],
    mean_slope: [null as number | null],
  });

  searchQuery = '';
  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.fetchBarangays();
    this.fetchBarangayProfiles();
  }

  fetchBarangays() {
    this.http.get<any>(`${environment.apiUrl}/barangays`).subscribe(response => {
      this.barangays = response.barangays || [];
    });
  }

  fetchBarangayProfiles() {
    const params = {
      page: this.page.toString(),
      limit: this.limit.toString(),
      search: this.searchQuery
    };

    this.http.get<any>(`${environment.apiUrl}/barangayprofiles`, { params })
      .subscribe(response => {
        this.profiles = response.profiles || [];
        this.total = response.total || 0;
      });
  }

  openModal(record?: BarangayProfile) {
    this.isEditing = !!record;
    this.selectedId = record?.id ?? null;

    this.profileForm.reset({
      barangay_id: record?.barangay_id ? Number(record.barangay_id) : null,
      population: record?.population ?? null,
      area: record?.area ?? null,
      livelihood: record?.livelihood ?? null,
      max_slope: record?.max_slope ?? null,
      mean_slope: record?.mean_slope ?? null
    });

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.profileForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSubmit () {
     if (this.profileForm.invalid) return;

    const payload = this.profileForm.value;
    if (this.isEditing && this.selectedId !== null) {
      this.http
        .put(`${environment.apiUrl}/barangayprofiles/${this.selectedId}`, payload)
        .subscribe(() => {
        this.fetchBarangayProfiles();
        this.closeModal();
      });
    } else {
      this.http.post(`${environment.apiUrl}/barangayprofiles`, payload).subscribe(() => {
        this.fetchBarangayProfiles();
        this.closeModal();
      });
    }
  }

  onDelete(id: number) {
    if (!confirm('Delete this population record?')) return;
    this.http.delete(`${environment.apiUrl}/barangayprofiles/${id}`).subscribe(() => {
      this.fetchBarangayProfiles();
    });
  }

  onSearch() {
    this.page = 1;
    this.fetchBarangayProfiles();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchBarangayProfiles();
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
