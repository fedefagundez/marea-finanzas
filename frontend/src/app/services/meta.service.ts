import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Meta } from '../models';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private apiUrl = `${environment.apiUrl}/metas`;

  constructor(private http: HttpClient) {}

  listar(hogarId: string): Observable<Meta[]> {
    return this.http.get<Meta[]>(`${this.apiUrl}/hogar/${hogarId}`);
  }

  crear(data: {
    hogarId: string;
    nombre: string;
    montoObjetivo: number;
    fechaLimite: string;
    cuotaMensual?: number;
    gastoId?: string;
  }): Observable<Meta> {
    return this.http.post<Meta>(this.apiUrl, data);
  }

  actualizar(id: string, data: Partial<Pick<Meta, 'nombre' | 'montoObjetivo' | 'montoActual' | 'fechaLimite' | 'cuotaMensual' | 'gastoId'>>): Observable<Meta> {
    return this.http.put<Meta>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
