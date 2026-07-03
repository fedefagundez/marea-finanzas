import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly theme = signal<'light' | 'dark'>(this.getInitial());
  readonly current = this.theme.asReadonly();

  constructor() {
    effect(() => document.body.setAttribute('data-theme', this.theme()));
  }

  toggle(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    localStorage.setItem('marea-theme', next);
  }

  private getInitial(): 'light' | 'dark' {
    return (localStorage.getItem('marea-theme') as 'light' | 'dark') ?? 'light';
  }
}
