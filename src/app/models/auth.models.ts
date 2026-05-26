export type UserRole = 'ROLE_BROKER' | 'docente' | 'alumno' | 'padre';

export interface User {
  email: string;
  nombre: string;
  rol: UserRole;
}