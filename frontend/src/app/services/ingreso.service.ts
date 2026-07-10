import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ingreso } from '../models';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class IngresoService extends CrudService<Ingreso> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/ingresos`);
  }

  override crear(data: {
    hogarId: string;
    descripcion: string;
    monto: number;
    tipo: 'RECURRENTE' | 'PUNTUAL' | 'INDEFINIDO';
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<Ingreso> {
    return super.crear(data as Record<string, unknown>);
  }

  listarPorFiltros(hogarId: string, filtros: {
    desde?: string;
    hasta?: string;
  } = {}): Observable<Ingreso[]> {
    const params: Record<string, string> = {};
    if (filtros.desde) params['desde'] = filtros.desde;
    if (filtros.hasta) params['hasta'] = filtros.hasta;
    return this.http.get<Ingreso[]>(`${this.apiUrl}/hogar/${hogarId}`, { params });
  }
}
