import { Component, OnInit } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { EvacuationCenterImageService } from '../../../../core/services/evacuation-center-image.service';
import { DecimalPipe, NgFor, NgIf, CommonModule } from '@angular/common'; // Added CommonModule for safety
import { ActivatedRoute, RouterLink } from '@angular/router'; // <--- ADDED RouterLink HERE
import { EvacuationCenterService } from 'src/app/core/services/evacuation-center.service';

@Component({
  selector: 'app-manage-evacuation-center-images',
  standalone: true,
  // Added RouterLink to the imports array below
  imports: [NgIf, NgFor, DecimalPipe, RouterLink, CommonModule], 
  templateUrl: './manage-evacuation-center-images.component.html',
  styleUrl: './manage-evacuation-center-images.component.scss'
})
export class ManageEvacuationCenterImagesComponent implements OnInit {
  evacuationCenterId!: number;
  evacuationCenterName: string = '';
  images: any[] = [];
  uploadProgress = 0;
  isUploading = false;
  selectedFiles: File[] = [];
  previewImages: string[] = [];

  // For modal state
  isViewingImage = false;
  currentImageUrl = '';

  constructor(
    private route: ActivatedRoute,
    private evacuationCenterService: EvacuationCenterService,
    private imageService: EvacuationCenterImageService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.evacuationCenterId = Number(idParam);
    if (this.evacuationCenterId) {
      this.loadEvacuationCenterName();
      this.loadImages();
    }
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
  }

  uploadImages() {
    if (!this.selectedFiles.length || this.isUploading) return;
    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append('images', file));
    this.isUploading = true;

    this.imageService.uploadImages(this.evacuationCenterId, formData)
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((event.loaded / event.total) * 100);
        }
        if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.selectedFiles = [];
          this.loadImages();
        }
      });
  }

  deleteImage(image: any) {
    if (!confirm('Delete this image?')) return;
    this.imageService.deleteImage(image.id).subscribe(() => this.loadImages());
  }

  setPrimaryImage(image: any) {
    this.imageService.setPrimary(this.evacuationCenterId, image.id).subscribe(() => this.loadImages());
  }

  closeImageView() {
    this.isViewingImage = false;
    this.currentImageUrl = '';
  }
}