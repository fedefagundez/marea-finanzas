import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BalanceMes, Dashboard, Evolucion, MovimientoReciente, Proyeccion, DistribucionGasto } from '../models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  dashboard(hogarId: string): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.apiUrl}/hogar/${hogarId}/dashboard`);
  }

  evolucion(hogarId: string, meses: number = 6): Observable<Evolucion[]> {
    return this.http.get<Evolucion[]>(`${this.apiUrl}/hogar/${hogarId}/evolucion`, {
      params: { meses: meses.toString() }
    });
  }

  proyeccion(hogarId: string, meses: number = 3): Observable<Proyeccion[]> {
    return this.http.get<Proyeccion[]>(`${this.apiUrl}/hogar/${hogarId}/proyeccion`, {
      params: { meses: meses.toString() }
    });
  }

  balanceMes(hogarId: string, mes: string): Observable<BalanceMes> {
    return this.http.get<BalanceMes>(`${this.apiUrl}/hogar/${hogarId}/balance-mes`, {
      params: { mes }
    });
  }

  movimientosRecientes(hogarId: string, limite: number = 5): Observable<MovimientoReciente[]> {
    return this.http.get<MovimientoReciente[]>(`${this.apiUrl}/hogar/${hogarId}/movimientos-recientes`, {
      params: { limite: limite.toString() }
    });
  }

  distribucionGastos(hogarId: string): Observable<DistribucionGasto[]> {
    return this.http.get<DistribucionGasto[]>(`${this.apiUrl}/hogar/${hogarId}/distribucion-gastos`);
  }
}
