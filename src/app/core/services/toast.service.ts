import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  // Signal que contiene el array de notificaciones
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(title: string, message: string, type: ToastType = 'info', duration = 5000) {
    const id = this.counter++;
    const newToast: Toast = { id, title, message, type, duration };
    this.toasts.update(current => [...current, newToast]);
    // Auto-eliminar después del tiempo definido
    /*setTimeout(() => {
      this.remove(id);
    }, duration);*/
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

}
