import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Barangay } from 'src/app/shared/models/barangay.model';
import { environment } from 'src/environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-manage-barangays',
  standalone: true,
  imports: [AngularSvgIconModule, NgFor],
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

      console.log(response);
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

}
