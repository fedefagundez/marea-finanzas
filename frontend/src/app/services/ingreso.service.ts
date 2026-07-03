import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ingreso } from '../models';

@Injectable({ providedIn: 'root' })
export class IngresoService {
  private apiUrl = `${environment.apiUrl}/ingresos`;

  constructor(private http: HttpClient) {}

  crear(data: {
    hogarId: string;
    descripcion: string;
    monto: number;
    tipo: 'RECURRENTE' | 'PUNTUAL' | 'INDEFINIDO';
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<Ingreso> {
    return this.http.post<Ingreso>(this.apiUrl, data);
  }

  listarPorHogar(hogarId: string): Observable<Ingreso[]> {
    return this.http.get<Ingreso[]>(`${this.apiUrl}/hogar/${hogarId}`);
  }

  actualizar(id: string, data: Partial<Ingreso>): Observable<Ingreso> {
    return this.http.put<Ingreso>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
