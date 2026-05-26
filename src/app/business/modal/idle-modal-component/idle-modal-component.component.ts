import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-idle-modal-component',
  standalone: true,
  imports: [],
  templateUrl: './idle-modal-component.component.html',
  styleUrl: './idle-modal-component.component.css'
})
export class IdleModalComponentComponent {

  @Output() logout = new EventEmitter<void>();
  @Output() stay = new EventEmitter<void>();

  onLogout() { this.logout.emit(); }
  onStay() { this.stay.emit(); }

}
