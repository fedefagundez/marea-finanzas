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
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(11, 37, 48, 0.55);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      animation: fadeIn .15s ease;
    }

    .modal-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      width: 100%;
      max-width: 380px;
      box-shadow: var(--shadow-lg);
      animation: slideUp .2s ease;
    }

    .modal-title {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 10px;
      color: var(--text-1);
    }

    .modal-message {
      font-size: 14px;
      color: var(--text-2);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
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
