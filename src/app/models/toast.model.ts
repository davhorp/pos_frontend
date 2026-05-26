export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
}