import { Component, ElementRef, forwardRef, inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  template: `
    <div class="marea-date-wrapper">
      <input
        #input
        type="text"
        class="marea-date-input"
        [attr.placeholder]="placeholder"
        [attr.required]="required ? true : null"
        [disabled]="disabled"
      />
      <span class="marea-date-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </span>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('input', { static: true }) inputRef!: ElementRef<HTMLInputElement>;

  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;

  private instance: flatpickr.Instance | null = null;
  private value: string | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    try {
      this.instance = flatpickr(this.inputRef.nativeElement, {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        locale: Spanish,
        allowInput: true,
        clickOpens: true,
        defaultDate: this.value || undefined,
        onReady: (_, __, instance) => {
          if (instance.altInput) {
            instance.altInput.removeAttribute('readonly');
            instance.altInput.classList.add('marea-date-input');
            instance.altInput.style.paddingRight = '38px';
          }
        },
        onChange: (selectedDates) => {
          const date = selectedDates[0];
          const newValue = date ? this.formatDate(date) : null;
          this.value = newValue;
          this.onChange(newValue);
          this.onTouched();
        },
        onClose: () => {
          this.onTouched();
        },
      });
    } catch (e) {
      console.error('[DatePicker] Error al inicializar flatpickr:', e);
    }
  }

  ngOnDestroy() {
    this.instance?.destroy();
  }

  writeValue(value: string | null): void {
    this.value = value || null;
    if (this.instance) {
      if (value) {
        this.instance.setDate(value, false);
      } else {
        this.instance.clear(false);
      }
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.instance) {
      if (isDisabled) {
        this.inputRef.nativeElement.setAttribute('disabled', 'true');
      } else {
        this.inputRef.nativeElement.removeAttribute('disabled');
      }
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
