import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria } from '../models';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class CategoriaService extends CrudService<Categoria> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/categorias`);
  }

  listar(hogarId: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}?hogarId=${hogarId}`);
  }

  override crear(data: { nombre: string; icon: string; hogarId: string }): Observable<Categoria> {
    return super.crear(data as Record<string, unknown>);
  }

  override actualizar(id: string, data: Partial<Pick<Categoria, 'nombre' | 'icon'>>): Observable<Categoria> {
    return super.actualizar(id, data as Partial<Categoria>);
  }
}
