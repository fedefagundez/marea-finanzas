import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Hogar } from '../models';

@Injectable({ providedIn: 'root' })
export class HogarService {
  private apiUrl = `${environment.apiUrl}/hogares`;

  constructor(private http: HttpClient) {}

  crear(nombre: string): Observable<Hogar> {
    return this.http.post<Hogar>(this.apiUrl, { nombre });
  }

  listar(): Observable<Hogar[]> {
    return this.http.get<Hogar[]>(this.apiUrl);
  }

  obtener(id: string): Observable<Hogar> {
    return this.http.get<Hogar>(`${this.apiUrl}/${id}`);
  }

  invitar(hogarId: string, email?: string): Observable<{ mensaje: string; hogarId: string; tokenInvitacion: string }> {
    return this.http.post<{ mensaje: string; hogarId: string; tokenInvitacion: string }>(`${this.apiUrl}/${hogarId}/invitar`, email ? { email } : {});
  }

  unirse(token: string): Observable<{ mensaje: string; hogar: Hogar }> {
    return this.http.post<{ mensaje: string; hogar: Hogar }>(`${this.apiUrl}/unirse`, { token });
  }

  eliminar(hogarId: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${hogarId}`);
  }

  quitarMiembro(hogarId: string, miembroId: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${hogarId}/miembros/${miembroId}`);
  }
}
