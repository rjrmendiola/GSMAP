import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EvacuationCenter } from 'src/app/shared/models/evacuation-center.model';
import { EvacuationCenterService } from 'src/app/core/services/evacuation-center.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-manage-evacuation-centers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manage-evacuation-centers.component.html',
  styleUrl: './manage-evacuation-centers.component.scss'
})
export class ManageEvacuationCentersComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private evacuationCenterService =  inject(EvacuationCenterService);

  // centers: EvacuationCenter[] = [];
  centers: any[] = [];
  isEditing = false;
  selectedId: number | null = null;

  evacuationCenterForm = this.fb.group({
    name: ['', Validators.required],
    location: [''],
    latitude: [0],
    longitude: [0],
    capacity: [0]
  });

  searchQuery = '';

  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.fetchEvacuationCenters();
  }

  fetchEvacuationCenters() {
    // this.evacuationCenterService.getAll().subscribe(data => this.centers = data);
    // const params = {
    //     page: this.page.toString(),
    //     limit: this.limit.toString(),
    //     search: this.searchQuery
    //   };

    //   this.http.get<any>(`${environment.apiUrl}/barangayofficials`, { params }).subscribe(response => {
    //     this.centers = response.centers || [];
    //     this.total = response.total || 0;
    //   });


    this.evacuationCenterService.getAll().subscribe((data) => {
      this.centers = data;
    });
  }

  submitForm() {
    // const payload = this.evacuationCenterForm.value;
    const payload = this.evacuationCenterForm.getRawValue() as EvacuationCenter;
    if (this.selectedId) {
      this.evacuationCenterService.update(this.selectedId, payload).subscribe(() => {
        this.resetForm();
        this.fetchEvacuationCenters();
      });
    } else {
      this.evacuationCenterService.create(payload).subscribe(() => {
        this.resetForm();
        this.fetchEvacuationCenters();
      });
    }
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

  resetForm() {
    this.evacuationCenterForm.reset();
    this.selectedId = null;
  }
}

