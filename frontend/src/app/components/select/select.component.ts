import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="select-custom" (click)="toggleDropdown($event)">
      <div class="select-value">
        <span *ngIf="selectedId; else placeholderText">{{ getSelectedName() }}</span>
        <ng-template #placeholderText><span class="select-placeholder">{{ placeholder }}</span></ng-template>
      </div>
      <div class="select-arrow"></div>

      <div class="select-dropdown" *ngIf="isOpen">
        <div *ngFor="let opt of options"
             class="select-option"
             [class.selected]="opt.id === selectedId"
             (click)="selectOption(opt.id)">
          <span>{{ opt.nombre }}</span>
          <span class="select-check" *ngIf="opt.id === selectedId">✓</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-block; width: 100%; }

    .select-custom {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 36px;
      padding: 0 28px 0 12px;
      border: 1.5px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      font-size: 13px;
      font-family: var(--font-body);
      color: var(--text-1);
      cursor: pointer;
      transition: border-color .15s ease, box-shadow .15s ease;
      user-select: none;
    }
    .select-custom:hover {
      border-color: var(--n-400);
    }
    .select-custom:focus-within {
      border-color: var(--accent);
      box-shadow: var(--ring);
    }

    .select-value {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 36px;
    }

    .select-placeholder {
      color: var(--text-3);
    }

    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid var(--n-500);
    }

    .select-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
      animation: dropdownIn .15s ease;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .select-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      color: var(--text-1);
      cursor: pointer;
      transition: background .1s ease;
    }
    .select-option:hover {
      background: var(--surface-2);
    }
    .select-option.selected {
      background: var(--accent-soft);
      color: var(--accent-strong);
      font-weight: 600;
    }

    .select-check {
      color: var(--accent);
      font-weight: 700;
      font-size: 14px;
    }

    .select-dropdown::-webkit-scrollbar {
      width: 6px;
    }
    .select-dropdown::-webkit-scrollbar-track {
      background: transparent;
    }
    .select-dropdown::-webkit-scrollbar-thumb {
      background: var(--n-300);
      border-radius: 3px;
    }
  `]
})
export class SelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() selectedId = '';
  @Input() placeholder = 'Seleccionar';
  @Output() selectedChange = new EventEmitter<string>();

  isOpen = false;

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  selectOption(id: string) {
    this.selectedId = id;
    this.selectedChange.emit(id);
    this.isOpen = false;
  }

  getSelectedName(): string {
    const found = this.options.find(o => o.id === this.selectedId);
    return found ? found.nombre : this.placeholder;
  }
}
