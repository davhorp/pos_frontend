import { Component, ElementRef, ViewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-photo-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-profile.component.html',
  styleUrl: './photo-profile.component.css'
})
export class PhotoProfileComponent {

  private usrService = inject(UserService);
  private userSettings = JSON.parse(localStorage.getItem('user_settings') || '{}');

  @ViewChild('video') videoEle!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasEle!: ElementRef<HTMLCanvasElement>;

  isCameraOpen = signal(false);
  previewUrl = signal<string | null>(null);
  capturedBlob: Blob | null = null;

  // 1. Abrir Cámara
  async startCamera() {
    this.isCameraOpen.set(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.videoEle.nativeElement.srcObject = stream;
  }

  // 2. Tomar Selfie
  takeSelfie() {
    const video = this.videoEle.nativeElement;
    const canvas = this.canvasEle.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      this.capturedBlob = blob;
      if (blob) this.previewUrl.set(URL.createObjectURL(blob));
      this.stopCamera();
    }, 'image/jpeg');
  }

  // 3. Cargar desde Galería
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.capturedBlob = file;
      this.previewUrl.set(URL.createObjectURL(file));
    }
  }

  stopCamera() {
    const stream = this.videoEle.nativeElement.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    this.isCameraOpen.set(false);
  }

  async upload() {
    if (this.capturedBlob) {
      this.usrService.subirFoto(localStorage.getItem('user_email') || '{}', this.capturedBlob).subscribe(() => {
        alert('Foto actualizada correctamente');
      });
    }
  }

}
