import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminUsuario {
  id: string;
  username: string;
  email: string;
  rol: string;
  createdAt: string;
  hogares: number;
  movimientos: number;
  metas: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listarUsuarios() {
    return this.http.get<AdminUsuario[]>(`${this.apiUrl}/usuarios`);
  }

  eliminarUsuario(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}`);
  }

  resetPassword(id: string, password: string) {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}/reset-password`, { password });
  }

  cambiarRol(id: string, rol: string) {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}/rol`, { rol });
  }
}
