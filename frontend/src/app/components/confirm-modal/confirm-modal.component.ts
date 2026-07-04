import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="state().show" (click)="onCancel()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-title">Confirmar</div>
        <div class="modal-message">{{ state().message }}</div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary btn-md" (click)="onCancel()">Cancelar</button>
          <button type="button" class="btn btn-danger btn-md" (click)="onAccept()">Confirmar</button>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class ConfirmModalComponent {
  private confirmService = inject(ConfirmService);
  state = this.confirmService.getState();

  onAccept() {
    this.confirmService.accept();
  }

  onCancel() {
    this.confirmService.cancel();
  }
}
