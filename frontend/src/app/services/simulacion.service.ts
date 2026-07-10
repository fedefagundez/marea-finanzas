import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Simulacion, ItemSimulacion, ProyeccionSimulacionResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class SimulacionService {
  private apiUrl = `${environment.apiUrl}/simulaciones`;

  constructor(private http: HttpClient) {}

  listar(hogarId: string): Observable<Simulacion[]> {
    return this.http.get<Simulacion[]>(`${this.apiUrl}/hogar/${hogarId}`);
  }

  crear(hogarId: string, nombre: string): Observable<Simulacion> {
    return this.http.post<Simulacion>(`${this.apiUrl}/hogar/${hogarId}`, { nombre });
  }

  actualizar(id: string, nombre: string): Observable<Simulacion> {
    return this.http.put<Simulacion>(`${this.apiUrl}/${id}`, { nombre });
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }

  listarItems(simulacionId: string): Observable<ItemSimulacion[]> {
    return this.http.get<ItemSimulacion[]>(`${this.apiUrl}/${simulacionId}/items`);
  }

  agregarItem(simulacionId: string, item: {
    descripcion: string;
    monto: number;
    tipo: string;
    subtipo: string;
    fechaInicio?: string | null;
    cuotasTotales?: number | null;
  }): Observable<ItemSimulacion> {
    return this.http.post<ItemSimulacion>(`${this.apiUrl}/${simulacionId}/items`, item);
  }

  actualizarItem(itemId: string, item: Partial<ItemSimulacion>): Observable<ItemSimulacion> {
    return this.http.put<ItemSimulacion>(`${this.apiUrl}/items/${itemId}`, item);
  }

  eliminarItem(itemId: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/items/${itemId}`);
  }

  proyeccion(simulacionId: string, meses: number = 12, pasados: number = 6): Observable<ProyeccionSimulacionResponse> {
    return this.http.get<ProyeccionSimulacionResponse>(`${this.apiUrl}/${simulacionId}/proyeccion`, {
      params: { meses: meses.toString(), pasados: pasados.toString() },
    });
  }
}
