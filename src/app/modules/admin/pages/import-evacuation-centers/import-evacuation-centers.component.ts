import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BarangayService } from 'src/app/core/services/barangay.service';
import { EvacuationCenterService } from 'src/app/core/services/evacuation-center.service';

@Component({
  selector: 'app-import-evacuation-centers',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './import-evacuation-centers.component.html',
  styleUrl: './import-evacuation-centers.component.scss'
})
export class ImportEvacuationCentersComponent {

  selectedFile: File | null = null;
  isUploading = false;

  result: any = null;
  error: string | null = null;

  constructor(private evacuationCenterService: EvacuationCenterService) {}

  /* =========================
     FILE SELECTION
  ========================= */
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.result = null;
    this.error = null;
  }

  /* =========================
     UPLOAD
  ========================= */
  upload() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.error = null;
    this.result = null;

    this.evacuationCenterService.importEvacuationCenters(this.selectedFile).subscribe({
      next: (res) => {
        this.result = res;
        this.isUploading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Import failed';
        this.isUploading = false;
      }
    });
  }
}
