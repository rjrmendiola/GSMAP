import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Barangay } from 'src/app/shared/models/barangay.model';
import { RouterModule } from '@angular/router';

// Interface for Livelihood Data
export interface Livelihood {
  id?: number;
  barangay_id: number;
  livelihood_type: string; // e.g., Farming, Fishing, Retail
  total_practitioners: number;
  average_monthly_income?: number;
}

@Component({
  selector: 'app-manage-livelihood',
  standalone: true,
  imports: [AngularSvgIconModule, CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './manage-livelihood.component.html',
  styleUrl: './manage-livelihood.component.scss'
})
export class ManageLivelihoodComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  livelihoods: Livelihood[] = [];
  barangays: Barangay[] = [];
  isEditing = false;
  selectedId: number | null = null;
  isModalOpen = false;

  // Form updated for Livelihood metrics
  livelihoodForm = this.fb.group({
    barangay_id: [null as number | null, Validators.required],
    livelihood_type: ['', [Validators.required]],
    total_practitioners: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  searchQuery = '';
  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.fetchBarangays();
    this.fetchLivelihoods();
  }

  fetchBarangays() {
    this.http.get<any>(`${environment.apiUrl}/barangays`).subscribe(response => {
      this.barangays = response.barangays || [];
    });
  }

  fetchLivelihoods() {
    const params = {
      page: this.page.toString(),
      limit: this.limit.toString(),
      search: this.searchQuery
    };

    this.http.get<any>(`${environment.apiUrl}/livelihood`, { params }).subscribe(response => {
      this.livelihoods = response.data || [];
      this.total = response.total || 0;
    });
  }

  openModal(record?: Livelihood) {
    this.isEditing = !!record;
    this.selectedId = record?.id ?? null;

    this.livelihoodForm.reset({
      barangay_id: record?.barangay_id ? Number(record.barangay_id) : null,
      livelihood_type: record?.livelihood_type ?? '',
      total_practitioners: record?.total_practitioners ?? null
    });

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.livelihoodForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSubmit() {
    if (this.livelihoodForm.invalid) return;

    const payload = this.livelihoodForm.value;
    const url = `${environment.apiUrl}/livelihood`;

    if (this.isEditing && this.selectedId !== null) {
      this.http.put(`${url}/${this.selectedId}`, payload).subscribe(() => {
        this.fetchLivelihoods();
        this.closeModal();
      });
    } else {
      this.http.post(url, payload).subscribe(() => {
        this.fetchLivelihoods();
        this.closeModal();
      });
    }
  }

  onDelete(id: number) {
    if (!confirm('Delete this livelihood record?')) return;
    this.http.delete(`${environment.apiUrl}/livelihood/${id}`).subscribe(() => {
      this.fetchLivelihoods();
    });
  }

  onSearch() {
    this.page = 1;
    this.fetchLivelihoods();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchLivelihoods();
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