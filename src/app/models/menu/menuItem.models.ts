interface MenuItem {
  title: string;
  icon: string; // Puede ser un emoji o la clase de FontAwesome/Google Icons
  route: string;
  divider?: boolean; // Para poner una línea separadora en el menú
}