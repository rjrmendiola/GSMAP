// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-manage-officials',
//   standalone: true,
//   imports: [],
//   templateUrl: './manage-officials.component.html',
//   styleUrl: './manage-officials.component.scss'
// })
// export class ManageOfficialsComponent {

// }

import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BarangayOfficial } from 'src/app/shared/models/barangay-official.model';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-manage-officials',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-officials.component.html',
})
export class ManageOfficialsComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  officials: BarangayOfficial[] = [];
  isEditing = false;
  selectedId: number | null = null;

  officialForm = this.fb.group({
    barangay_name: ['', Validators.required],
    name: ['', Validators.required],
    position: ['', Validators.required],
  });

  ngOnInit() {
    this.fetchOfficials();
  }

  fetchOfficials() {
    this.http.get<BarangayOfficial[]>(`${environment.apiUrl}/barangayofficials`).subscribe((data) => {
      this.officials = data;
    });
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
}
