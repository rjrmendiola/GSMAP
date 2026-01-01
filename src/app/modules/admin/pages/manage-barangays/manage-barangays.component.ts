import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Barangay } from 'src/app/shared/models/barangay.model';
import { environment } from 'src/environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-barangays',
  standalone: true,
  imports: [AngularSvgIconModule, NgIf, NgFor, NgClass, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './manage-barangays.component.html',
  styleUrl: './manage-barangays.component.scss'
})
export class ManageBarangaysComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  barangays: Barangay[] = [];
  isEditing = false;
  selectedId: number | null = null;

  barangayForm = this.fb.group({
    name: ['', Validators.required],
    slug: ''
  });

  isModalOpen = false;

  searchQuery = '';

  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.fetchBarangays();
  }

  fetchBarangays() {
    const params = {
      page: this.page.toString(),
      limit: this.limit.toString(),
      search: this.searchQuery
    };

    this.http.get<any>(`${environment.apiUrl}/barangays`, { params }).subscribe(response => {
      this.barangays = response.barangays || [];
      this.total = response.total || 0;
    });
  }

  openModal(barangay?: Barangay) {
    this.isEditing = !!barangay;
    this.selectedId = barangay?.id ?? null;

    this.barangayForm.reset({
      name: barangay?.name || '',
      slug: barangay?.slug || ''
    });

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.barangayForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSubmit() {
    if (this.barangayForm.invalid) return;

    const payload = this.barangayForm.value;

    if (this.isEditing && this.selectedId !== null) {
      this.http
        .put(`${environment.apiUrl}/barangays/${this.selectedId}`, payload)
        .subscribe(() => {
          this.fetchBarangays();
          this.resetForm();
        });
    } else {
      this.http.post(`${environment.apiUrl}/barangays`, payload).subscribe(() => {
        this.fetchBarangays();
        this.resetForm();
      });
    }
  }

  onEdit(barangay: Barangay) {
    this.isEditing = true;
    this.selectedId = barangay.id!;
    this.barangayForm.patchValue(barangay);
  }

  onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this barangay?')) return;
    this.http.delete(`${environment.apiUrl}/barangays/${id}`).subscribe(() => {
      this.fetchBarangays();
    });
  }

  resetForm() {
    this.barangayForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSearch() {
    this.page = 1;
    this.fetchBarangays();
  }

  onPageChange(newPage: number) {
    // this.page = newPage;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
    }
    this.fetchBarangays();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
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
