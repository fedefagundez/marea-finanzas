import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Gasto } from '../models';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class GastoService extends CrudService<Gasto> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/gastos`);
  }

  override crear(data: {
    hogarId: string;
    descripcion: string;
    monto: number;
    tipo: 'RECURRENTE' | 'PUNTUAL' | 'INDEFINIDO';
    fechaInicio?: string;
    cuotasTotales?: number;
    tarjetaId?: string;
    categoriaId?: string;
  }): Observable<Gasto> {
    return super.crear(data as Record<string, unknown>);
  }

  listarPorFiltros(hogarId: string, filtros: {
    desde?: string;
    hasta?: string;
    tipo?: string;
    categoriaId?: string;
    tarjetaId?: string;
  } = {}): Observable<Gasto[]> {
    const params: Record<string, string> = {};
    if (filtros.desde) params['desde'] = filtros.desde;
    if (filtros.hasta) params['hasta'] = filtros.hasta;
    if (filtros.tipo) params['tipo'] = filtros.tipo;
    if (filtros.categoriaId) params['categoriaId'] = filtros.categoriaId;
    if (filtros.tarjetaId) params['tarjetaId'] = filtros.tarjetaId;
    return this.http.get<Gasto[]>(`${this.apiUrl}/hogar/${hogarId}`, { params });
  }

  pagarCuota(id: string): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.apiUrl}/${id}/pagar-cuota`, {});
  }

  deshacerCuota(id: string): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.apiUrl}/${id}/deshacer-cuota`, {});
  }
}
