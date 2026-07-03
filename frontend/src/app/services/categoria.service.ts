import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  listar(hogarId: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}?hogarId=${hogarId}`);
  }

  crear(data: { nombre: string; icon: string; hogarId: string }): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, data);
  }

  actualizar(id: string, data: Partial<Pick<Categoria, 'nombre' | 'icon'>>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
