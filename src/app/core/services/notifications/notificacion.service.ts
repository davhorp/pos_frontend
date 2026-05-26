import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: number;
  tipo: 'asistencia' | 'circular' | 'pago' | 'calificacion';
  mensaje: string;
  fecha: Date;
  leido: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  // Lista de notificaciones cargadas
  private notificationsList = signal<AppNotification[]>([
    { id: 1, tipo: 'asistencia', mensaje: 'Mateo no registró entrada hoy.', fecha: new Date(), leido: false },
    { id: 2, tipo: 'circular', mensaje: 'Nueva circular: Festival de Primavera.', fecha: new Date(), leido: false },
    { id: 3, tipo: 'pago', mensaje: 'Recibo de Abril disponible.', fecha: new Date(), leido: true }
  ]);

  // Signal computado para el contador de la campana
  unreadCount = computed(() => 
    this.notificationsList().filter(n => !n.leido).length
  );

  allNotifications = this.notificationsList.asReadonly();

  marcarComoLeidas() {
    this.notificationsList.update(list => 
      list.map(n => ({ ...n, leido: true }))
    );
  }

  // Simulación de llegada de nueva notificación
  agregarNotificacion(notif: Omit<AppNotification, 'id' | 'leido'>) {
    const newNotif = { ...notif, id: Date.now(), leido: false };
    this.notificationsList.update(list => [newNotif, ...list]);
  }
  
}
