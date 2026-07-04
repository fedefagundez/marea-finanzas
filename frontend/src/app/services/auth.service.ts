import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { username, email, password });
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password });
  }

  refresh(refreshToken: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/refresh`, { refreshToken });
  }

  me() {
    return this.http.get<Usuario>(`${this.apiUrl}/me`);
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, { token, password });
  }

  saveTokens(token: string, refreshToken: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }

  cambiarEmail(email: string, password: string) {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/cambiar-email`, { email, password });
  }

  cambiarContrasenia(passwordActual: string, passwordNueva: string) {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/cambiar-contrasenia`, { passwordActual, passwordNueva });
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
