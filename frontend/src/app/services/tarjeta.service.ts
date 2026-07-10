import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TarjetaCredito } from '../models';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class TarjetaService extends CrudService<TarjetaCredito> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/tarjetas`);
  }

  crearTarjeta(hogarId: string, nombre: string, ultimo4: string, diaCierre?: number): Observable<TarjetaCredito> {
    return super.crear({ hogarId, nombre, ultimo4, diaCierre });
  }
}
