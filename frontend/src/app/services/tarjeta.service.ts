import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TarjetaCredito } from '../models';

@Injectable({ providedIn: 'root' })
export class TarjetaService {
  private apiUrl = `${environment.apiUrl}/tarjetas`;

  constructor(private http: HttpClient) {}

  crear(hogarId: string, nombre: string, ultimo4: string, diaCierre?: number): Observable<TarjetaCredito> {
    return this.http.post<TarjetaCredito>(this.apiUrl, { hogarId, nombre, ultimo4, diaCierre });
  }

  listarPorHogar(hogarId: string): Observable<TarjetaCredito[]> {
    return this.http.get<TarjetaCredito[]>(`${this.apiUrl}/hogar/${hogarId}`);
  }

  actualizar(id: string, data: Partial<TarjetaCredito>): Observable<TarjetaCredito> {
    return this.http.put<TarjetaCredito>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
