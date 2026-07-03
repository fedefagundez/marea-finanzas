import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  show: boolean;
  message: string;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private state = signal<ConfirmState>({ show: false, message: '', resolve: null });

  getState() {
    return this.state.asReadonly();
  }

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({ show: true, message, resolve });
    });
  }

  accept() {
    const { resolve } = this.state();
    if (resolve) resolve(true);
    this.close();
  }

  cancel() {
    const { resolve } = this.state();
    if (resolve) resolve(false);
    this.close();
  }

  private close() {
    this.state.set({ show: false, message: '', resolve: null });
  }
}
