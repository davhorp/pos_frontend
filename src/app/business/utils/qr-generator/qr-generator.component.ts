import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [],
  templateUrl: './qr-generator.component.html',
  styleUrl: './qr-generator.component.css'
})
export class QrGeneratorComponent {

  // Recibe el ID del alumno o el username generado
  value = input.required<string>();
  size = input<string>('150x150');

  // Computed signal que reacciona si el valor cambia
  qrUrl = computed(() => {
    const data = encodeURIComponent(this.value());
    return `https://api.qrserver.com/v1/create-qr-code/?size=${this.size()}&data=${data}`;
  });

}
