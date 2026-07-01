import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../core/auth.service';

interface ItemMenu {
  label: string;
  icon: string;
  link: string;
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
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private auth = inject(AuthService);
  readonly usuario = this.auth.usuario;

  readonly menu: ItemMenu[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-line', link: '/dashboard' },
    { label: 'Pedidos', icon: 'pi pi-shopping-cart', link: '/pedidos' },
    { label: 'Clientes', icon: 'pi pi-users', link: '/clientes' },
    { label: 'Productos', icon: 'pi pi-box', link: '/productos' },
    { label: 'Catálogos', icon: 'pi pi-tags', link: '/catalogos' },
  ];

  logout() {
    this.auth.logout();
  }
}
