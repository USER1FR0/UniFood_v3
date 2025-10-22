import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BorrarComponent } from './components/borrar/borrar.component';
import { authGuard } from './guards/auth.guard';
import { clienteGuard } from './guards/cliente.guard';
import { vendedorGuard } from './guards/vendedor.guard';
import { ClientePedidoComponent } from './components/cliente-pedido/cliente-pedido.component';
import { VendedorPedidoComponent } from './components/vendedor-pedido/vendedor-pedido.component';
import { MenuComponent } from './components/menu/menu.component';
import { ListaVendedoresComponent } from './components/lista-vendedores/lista-vendedores.component';
import { CrearVendedorComponent } from './components/crear-vendedor/crear-vendedor.component';

export const routes: Routes = [
    {path: '', redirectTo: 'lista-vendedores', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'borrar', component: BorrarComponent, canActivate: [authGuard]},
    {path: 'menu', component: MenuComponent},
    {path: 'lista-vendedores', component: ListaVendedoresComponent},
    {path: 'crear-vendedor', component: CrearVendedorComponent},
    {path: '**', redirectTo: 'lista-vendedores' }
  {
    path: 'login',
    component: LoginComponent,
  },
    {
    path: 'cliente',
    canActivate: [clienteGuard],
    loadComponent: () => import('../app/components/layouts/cliente-layout/cliente-layout.component')
      .then(m => m.ClienteLayoutComponent),
    children: [
      { 
        path: '', 
        redirectTo: 'carrito', 
        pathMatch: 'full' 
      },
      { 
        path: 'carrito', 
        loadComponent: () => import('./components/cliente-pedido/cliente-pedido.component')
          .then(m => m.ClientePedidoComponent)
      }
    ]
  },

  // Rutas de Vendedor
  {
    path: 'vendedor',
    canActivate: [vendedorGuard],
    loadComponent: () => import('../app/components/layouts/vendedor-layout/vendedor-layout.component')
      .then(m => m.VendedorLayoutComponent),
    children: [
      { 
        path: '', 
        loadComponent: () => import('./components/vendedor-pedido/vendedor-pedido.component')
          .then(m => m.VendedorPedidoComponent)
      }
    ]
  },

  { 
    path: '**', 
    redirectTo: '/login' 
  }
];
