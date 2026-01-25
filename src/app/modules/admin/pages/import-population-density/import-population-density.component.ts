import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BarangayService } from 'src/app/core/services/barangay.service';

@Component({
  selector: 'app-import-population-density',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './import-population-density.component.html',
  styleUrl: './import-population-density.component.scss'
})
export class ImportBarangaysComponent {

  selectedFile: File | null = null;
  isUploading = false;

  result: any = null;
  error: string | null = null;

  constructor(private barangayService: BarangayService) {}

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

    this.barangayService.importBarangays(this.selectedFile).subscribe({
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
