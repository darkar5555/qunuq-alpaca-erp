import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/solicitudes/solicitudes').then(
            (m) => m.Solicitudes,
          ),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/pedidos/pedidos').then((m) => m.Pedidos),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes').then((m) => m.Clientes),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/productos').then((m) => m.Productos),
      },
      {
        path: 'catalogos',
        loadComponent: () =>
          import('./features/catalogos/catalogos').then((m) => m.Catalogos),
      },
      {
        path: 'sitio',
        loadComponent: () =>
          import('./features/sitio/sitio').then((m) => m.Sitio),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
