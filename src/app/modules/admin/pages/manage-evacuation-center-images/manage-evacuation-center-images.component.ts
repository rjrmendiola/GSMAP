
import { Component, Input, OnInit } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { EvacuationCenterImageService } from '../../../../core/services/evacuation-center-image.service';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EvacuationCenter, EvacuationCenterService } from 'src/app/core/services/evacuation-center.service';

@Component({
  selector: 'app-manage-evacuation-center-images',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe],
  templateUrl: './manage-evacuation-center-images.component.html',
  styleUrl: './manage-evacuation-center-images.component.scss'
})
export class ManageEvacuationCenterImagesComponent implements OnInit {
  // @Input() evacuationCenterId!: number;
  evacuationCenterId!: number;
  evacuationCenterName: string = '';

  images: any[] = [];
  uploadProgress = 0;
  isUploading = false;

  selectedFiles: File[] = [];
  previewImages: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private evacuationCenterService: EvacuationCenterService,
    private imageService: EvacuationCenterImageService
  ) {}

  ngOnInit(): void {
    this.evacuationCenterId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadEvacuationCenterName();
    this.loadImages();
  }

  loadEvacuationCenterName() {
    this.evacuationCenterService.getById(this.evacuationCenterId)
      .subscribe(center => {
        this.evacuationCenterName = center.name;
      });
  }

  loadImages() {
    this.imageService
      .getImages(this.evacuationCenterId)
      .subscribe((res) => (this.images = res));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedFiles = Array.from(input.files);
    this.previewImages = [];

    this.selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  uploadImages() {
    if (!this.selectedFiles.length || this.isUploading) return;

    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    this.isUploading = true;

    this.imageService
      .uploadImages(this.evacuationCenterId, formData)
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(
            (event.loaded / event.total) * 100
          );
        }

        if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.selectedFiles = [];
          this.previewImages = [];
          this.loadImages();
        }
      });
  }

  deleteImage(image: any) {
    if (!confirm('Delete this image?')) return;

    this.imageService.deleteImage(image.id).subscribe(() => {
      this.loadImages();
    });
  }

  setPrimaryImage(image: any) {
    this.imageService.setPrimary(this.evacuationCenterId, image.id).subscribe(() => {
      this.loadImages();
    });
  }

  getImageUrl(path: string): string {
    return `/assets/${path}`;
  }

  trackByImageId(index: number, image: any): number {
    return image.id;
  }

  // For modal state
  isViewingImage = false;
  currentImageUrl = '';

  viewImage(image: any) {
    this.currentImageUrl = this.getImageUrl(image.path); // use your path resolver
    this.isViewingImage = true;
  }

  closeImageView() {
    this.isViewingImage = false;
    this.currentImageUrl = '';
  }

  uploadSelectedFiles() {
    if (!this.selectedFiles.length) return;

    const formData = new FormData();
    this.selectedFiles.forEach(f => formData.append('images', f));

    this.isUploading = true;

    this.imageService.uploadImages(this.evacuationCenterId, formData)
      .subscribe({
        next: () => {
          this.selectedFiles = [];
          this.isUploading = false;
          this.loadImages();
        },
        error: () => this.isUploading = false
      });
  }
}
