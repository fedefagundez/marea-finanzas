import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export class CrudService<T> {
  constructor(protected http: HttpClient, protected apiUrl: string) {}

  crear(data: Record<string, unknown>): Observable<T> {
    return this.http.post<T>(this.apiUrl, data);
  }

  listarPorHogar(hogarId: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/hogar/${hogarId}`);
  }

  actualizar(id: string, data: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
