import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EvacuationCenter } from 'src/app/shared/models/evacuation-center.model';
import { EvacuationCenterService } from 'src/app/core/services/evacuation-center.service';
import { environment } from 'src/environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Barangay } from 'src/app/shared/models/barangay.model';
import { BarangayOfficial } from 'src/app/shared/models/barangay-official.model';

@Component({
  selector: 'app-manage-evacuation-centers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AngularSvgIconModule],
  templateUrl: './manage-evacuation-centers.component.html',
  styleUrl: './manage-evacuation-centers.component.scss'
})
export class ManageEvacuationCentersComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private evacuationCenterService =  inject(EvacuationCenterService);

  barangays: Barangay[] = [];
  officials: BarangayOfficial[] = [];
  centers: any[] = [];
  isEditing = false;
  selectedId: number | null = null;

  evacuationCenterForm = this.fb.group({
    name: ['', Validators.required],
    barangay_id: [null as number | null, Validators.required],
    barangay_official_id: [null as number | null, Validators.required],
    latitude: [0],
    longitude: [0],
    venue: [''],
    image: ['']
  });

  isModalOpen = false;

  searchQuery = '';

  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.fetchBarangays();
    this.fetchOfficials();
    this.fetchEvacuationCenters();
  }

  fetchBarangays() {
    this.http.get<any>(`${environment.apiUrl}/barangays`, {}).subscribe(response => {
      this.barangays = response.barangays || [];
    });
  }

  fetchOfficials() {
    this.http.get<any>(`${environment.apiUrl}/barangayofficials`, {}).subscribe(response => {
      this.officials = response.officials || [];
    });
  }

  fetchEvacuationCenters() {
    // this.evacuationCenterService.getAll().subscribe(data => this.centers = data);
    // const params = {
    //     page: this.page.toString(),
    //     limit: this.limit.toString(),
    //     search: this.searchQuery
    //   };

    // this.evacuationCenterService.getAll().subscribe((data) => {
    //   this.centers = data;
    // });

    const params = {
      page: this.page.toString(),
      limit: this.limit.toString(),
      search: this.searchQuery
    };

    this.http.get<any>(`${environment.apiUrl}/evacuationcenters`, { params }).subscribe(response => {
      this.centers = response.centers || [];
      this.total = response.total || 0;
    });
  }

  submitForm() {
    // const payload = this.evacuationCenterForm.value;
    // const payload = this.evacuationCenterForm.getRawValue() as EvacuationCenter;
    // if (this.selectedId) {
    //   this.evacuationCenterService.update(this.selectedId, payload).subscribe(() => {
    //     this.resetForm();
    //     this.fetchEvacuationCenters();
    //   });
    // } else {
    //   this.evacuationCenterService.create(payload).subscribe(() => {
    //     this.resetForm();
    //     this.fetchEvacuationCenters();
    //   });
    // }
  }

  edit(center: any) {
    this.selectedId = center.id;
    this.evacuationCenterForm.patchValue(center);
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this center?')) {
      this.evacuationCenterService.delete(id).subscribe(() => this.fetchEvacuationCenters());
    }
  }

  onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this evacuation center?')) return;
    this.http.delete(`${environment.apiUrl}/evacuationcenters/${id}`).subscribe(() => {
      this.fetchEvacuationCenters();
    });
  }

  openModal(center?: EvacuationCenter) {
    this.isEditing = !!center;
    this.selectedId = center?.id ?? null;

    this.evacuationCenterForm.reset({
      name: center?.name || '',
    });

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.evacuationCenterForm.reset();
    this.isEditing = false;
    this.selectedId = null;
  }

  onSubmit() {
    if (this.evacuationCenterForm.invalid) return;

    const payload = this.evacuationCenterForm.value;

    if (this.isEditing && this.selectedId !== null) {
      this.http
        .put(`${environment.apiUrl}/evacuationcenters/${this.selectedId}`, payload)
        .subscribe(() => {
          this.fetchEvacuationCenters();
          this.resetForm();
        });
    } else {
      this.http.post(`${environment.apiUrl}/evacuationcenters`, payload).subscribe(() => {
        this.fetchEvacuationCenters();
        this.resetForm();
      });
    }
  }

  resetForm() {
    this.evacuationCenterForm.reset();
    this.selectedId = null;
  }

  onSearch() {
    this.page = 1;
    this.fetchEvacuationCenters();
  }

  getBarangayName(barangay_id: number): string {
    const barangay = this.barangays.find(b => b.id === barangay_id);
    return barangay ? barangay.name : 'Unknown';
  }

  getBarangayOfficialName(barangay_official_id: number): string {
    const official = this.officials.find(b => b.id === barangay_official_id);
    return official ? official.name : 'Unknown';
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

