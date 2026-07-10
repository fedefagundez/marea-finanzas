import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'ingresos', loadComponent: () => import('./pages/ingresos/ingresos.component').then(m => m.IngresosComponent) },
      { path: 'gastos', loadComponent: () => import('./pages/gastos/gastos.component').then(m => m.GastosComponent) },
      { path: 'hogares', loadComponent: () => import('./pages/hogares/hogares.component').then(m => m.HogaresComponent) },
      { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: 'metas', loadComponent: () => import('./pages/metas/metas.component').then(m => m.MetasComponent) },
      { path: 'categorias', loadComponent: () => import('./pages/categorias/categorias.component').then(m => m.CategoriasComponent) },
      { path: 'simulaciones', loadComponent: () => import('./pages/simulaciones/simulaciones.component').then(m => m.SimulacionesComponent) },
      { path: 'simulaciones/:id', loadComponent: () => import('./pages/simulacion/simulacion.component').then(m => m.SimulacionComponent) },
      { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent), canActivate: [adminGuard] },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
