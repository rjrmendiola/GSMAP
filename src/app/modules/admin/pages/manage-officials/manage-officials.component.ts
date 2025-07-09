import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BarangayOfficial } from 'src/app/shared/models/barangay-official.model';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Barangay } from 'src/app/shared/models/barangay.model';

@Component({
  selector: 'app-manage-officials',
  standalone: true,
  imports: [AngularSvgIconModule, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-officials.component.html',
  styleUrl: './manage-officials.component.scss'
})
export class ManageOfficialsComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  officials: BarangayOfficial[] = [];
  barangays: Barangay[] = [];
  isEditing = false;
  selectedId: number | null = null;

  officialForm = this.fb.group({
    barangay_id: [null as number | null, Validators.required],
    name: ['', Validators.required],
    position: ['', Validators.required],
  });

  isModalOpen = false;

  searchQuery = '';

  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.fetchBarangays();
    this.fetchOfficials();
  }

  fetchBarangays() {
    this.http.get<any>(`${environment.apiUrl}/barangays`, {}).subscribe(response => {
      this.barangays = response.barangays || [];
    });
  }

  fetchOfficials() {
    // this.http.get<BarangayOfficial[]>(`${environment.apiUrl}/barangayofficials`).subscribe((data) => {
    //   this.officials = data;
    // });

    const params = {
      page: this.page.toString(),
      limit: this.limit.toString(),
      search: this.searchQuery
    };

    this.http.get<any>(`${environment.apiUrl}/barangayofficials`, { params }).subscribe(response => {
      this.officials = response.officials || [];
      this.total = response.total || 0;
    });
  }

  openModal(official?: BarangayOfficial) {
    this.isEditing = !!official;
    this.selectedId = official?.id ?? null;

    this.officialForm.reset({
      // barangay_id: official?.barangay_id || null,
      barangay_id: official?.barangay_id ? Number(official.barangay_id) : null,
      name: official?.name || '',
      position: official?.position || ''
    });

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.officialForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSubmit() {
    if (this.officialForm.invalid) return;

    const payload = this.officialForm.value;

    if (this.isEditing && this.selectedId !== null) {
      this.http
        .put(`${environment.apiUrl}/barangayofficials/${this.selectedId}`, payload)
        .subscribe(() => {
          this.fetchOfficials();
          this.resetForm();
        });
    } else {
      this.http.post(`${environment.apiUrl}/barangayofficials`, payload).subscribe(() => {
        this.fetchOfficials();
        this.resetForm();
      });
    }
  }

  onEdit(official: BarangayOfficial) {
    this.isEditing = true;
    this.selectedId = official.id!;
    this.officialForm.patchValue(official);
  }

  onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this official?')) return;
    this.http.delete(`${environment.apiUrl}/barangayofficials/${id}`).subscribe(() => {
      this.fetchOfficials();
    });
  }

  resetForm() {
    this.officialForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSearch() {
    // const params = this.searchQuery
    //   ? { params: { search: this.searchQuery } }
    //   : {};

    // this.http.get<BarangayOfficial[]>(`${environment.apiUrl}/barangayofficials/`, params).subscribe(data => {
    //   this.officials = data;
    // });

    this.page = 1;
    this.fetchOfficials();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchOfficials();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  getBarangayName(barangay_id: number): string {
    const barangay = this.barangays.find(b => b.id === barangay_id);
    return barangay ? barangay.name : 'Unknown';
  }

  get pageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxDisplayed = 5;  // Max number of pages to display (excluding first, last, and ellipsis)

    if (this.totalPages <= 7) {
      // If total pages are small, show all
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', this.totalPages);
      } else if (this.page >= this.totalPages - 3) {
        pages.push(1, '...', this.totalPages - 4, this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages);
      } else {
        pages.push(1, '...', this.page - 1, this.page, this.page + 1, '...', this.totalPages);
      }
    }

    return pages;
  }

  handlePageClick(p: number | string) {
    if (p !== '...') {
      this.onPageChange(p as number);
    }
  }

}
