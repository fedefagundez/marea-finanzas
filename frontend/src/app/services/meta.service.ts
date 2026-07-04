import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Meta } from '../models';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class MetaService extends CrudService<Meta> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/metas`);
  }

  listar(hogarId: string): Observable<Meta[]> {
    return this.listarPorHogar(hogarId);
  }

  override crear(data: {
    hogarId: string;
    nombre: string;
    montoObjetivo: number;
    fechaLimite: string;
    cuotaMensual?: number;
    gastoId?: string;
  }): Observable<Meta> {
    return super.crear(data as Record<string, unknown>);
  }

  override actualizar(id: string, data: Partial<Pick<Meta, 'nombre' | 'montoObjetivo' | 'montoActual' | 'fechaLimite' | 'cuotaMensual' | 'gastoId'>>): Observable<Meta> {
    return super.actualizar(id, data as Partial<Meta>);
  }
}
