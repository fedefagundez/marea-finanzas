import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
  name: 'arsCurrency',
  standalone: true,
  pure: true
})
export class ArsCurrencyPipe implements PipeTransform {
  private currencyPipe = new CurrencyPipe('es-AR');

  transform(value: number | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    return this.currencyPipe.transform(value, 'ARS', 'symbol', '1.0-0', 'es-AR');
  }
}
