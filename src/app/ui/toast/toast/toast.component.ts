import { Component, input, output, OnInit, OnDestroy, computed } from '@angular/core';
import { Toast } from '../../../models/toast.model';
import { CommonModule } from '@angular/common';
import { TOAST_ICONS } from '../../../models/toast.icons';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent implements OnInit, OnDestroy{

  data = input.required<Toast>();
  close = output<number>();

  icon = computed(() => TOAST_ICONS[this.data().type]);

  private timeoutId: any;
  private remainingTime: number = 0;
  private startTime: number = 0;

  ngOnInit() {
    this.remainingTime = this.data().duration || 5000;
    this.startTimer();
  }

  startTimer() {
    this.startTime = Date.now();
    this.timeoutId = setTimeout(() => {
      this.close.emit(this.data().id);
    }, this.remainingTime);
  }

  pauseTimer() {
    // Cancelamos el cierre programado
    clearTimeout(this.timeoutId);
    // Calculamos cuánto tiempo le quedaba antes de pausar
    this.remainingTime -= Date.now() - this.startTime;
  }

  resumeTimer() {
    // Si el tiempo restante es muy bajo, lo cerramos, de lo contrario reiniciamos
    if (this.remainingTime > 0) {
      this.startTimer();
    }
  }

  ngOnDestroy() {
    // Limpieza de seguridad para evitar fugas de memoria
    clearTimeout(this.timeoutId);
  }

}
