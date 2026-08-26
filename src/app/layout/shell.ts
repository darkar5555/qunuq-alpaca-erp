import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../core/auth.service';
import { Rol } from '../core/models';
import { SolicitudesService } from '../features/solicitudes/solicitudes.service';

interface ItemMenu {
  label: string;
  icon: string;
  link: string;
  roles?: Rol[]; // si se define, solo esos roles lo ven
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private auth = inject(AuthService);
  private solicitudesApi = inject(SolicitudesService);
  readonly usuario = this.auth.usuario;

  // Contador de solicitudes nuevas (badge en el menú).
  readonly solicitudesNuevas = this.solicitudesApi.nuevas;

  // Barra lateral en móvil: cerrada por defecto, se abre con el botón de menú.
  readonly sidebarAbierto = signal(false);

  toggleSidebar() {
    this.sidebarAbierto.update((v) => !v);
  }

  cerrarSidebar() {
    this.sidebarAbierto.set(false);
  }

  readonly menu: ItemMenu[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-line', link: '/dashboard' },
    { label: 'Solicitudes', icon: 'pi pi-inbox', link: '/solicitudes', roles: ['ADMIN', 'VENTAS'] },
    { label: 'Pedidos', icon: 'pi pi-shopping-cart', link: '/pedidos' },
    { label: 'Clientes', icon: 'pi pi-users', link: '/clientes' },
    { label: 'Productos', icon: 'pi pi-box', link: '/productos' },
    { label: 'Catálogos', icon: 'pi pi-tags', link: '/catalogos' },
    { label: 'Inventario', icon: 'pi pi-database', link: '/inventario', roles: ['ADMIN', 'PRODUCCION'] },
    { label: 'Personal', icon: 'pi pi-id-card', link: '/personal', roles: ['ADMIN', 'PRODUCCION'] },
    { label: 'Finanzas', icon: 'pi pi-money-bill', link: '/finanzas', roles: ['ADMIN'] },
    { label: 'Sitio web', icon: 'pi pi-globe', link: '/sitio', roles: ['ADMIN'] },
    { label: 'Usuarios', icon: 'pi pi-user', link: '/usuarios', roles: ['ADMIN'] },
  ];

  // Solo muestra los ítems permitidos para el rol del usuario.
  readonly menuVisible = computed(() =>
    this.menu.filter((m) => !m.roles || this.auth.tieneRol(...m.roles)),
  );

  constructor() {
    // Carga el contador de solicitudes nuevas al entrar.
    this.solicitudesApi.refrescarNuevas();
  }

  logout() {
    this.auth.logout();
  }
}
