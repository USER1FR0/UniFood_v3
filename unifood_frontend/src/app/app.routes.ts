import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BorrarComponent } from './components/borrar/borrar.component';
import { authGuard } from './guards/auth.guard';
import { clienteGuard } from './guards/cliente.guard';
import { vendedorGuard } from './guards/vendedor.guard';
import { supervisorGuard } from './guards/supervisor.guard';
import { ClientePedidoComponent } from './components/cliente-pedido/cliente-pedido.component';
import { VendedorPedidoComponent } from './components/vendedor-pedido/vendedor-pedido.component';
import { MenuComponent } from './components/menu/menu.component';
import { ListaVendedoresComponent } from './components/lista-vendedores/lista-vendedores.component';
import { CrearVendedorComponent } from './components/crear-vendedor/crear-vendedor.component';
import { ClienteLayoutComponent } from './components/layouts/cliente-layout/cliente-layout.component';
import { VendedorLayoutComponent } from './components/layouts/vendedor-layout/vendedor-layout.component';
import { SupervisorLayoutComponent } from './components/layouts/supervisor-layout/supervisor-layout.component';
import { SupervisorDashboardComponent } from './components/supervisor-dashboard/supervisor-dashboard.component';
import { ChatComponent } from './components/chat/chat.component';
import { RecomendacionesHomeComponent } from './components/recomendaciones-home/recomendaciones-home.component';
import { SupervisorRecomendacionesComponent } from './components/supervisor-recomendaciones/supervisor-recomendaciones.component';

export const routes: Routes = [
  { path: '', redirectTo: 'lista-vendedores', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  //{ path: 'borrar', component: BorrarComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'crear-vendedor', component: CrearVendedorComponent },

  // ========== CLIENTE ==========
  {
    path: 'cliente',
    canActivate: [clienteGuard],
    component: ClienteLayoutComponent, 
    children: [
      { path: '', redirectTo: 'carrito', pathMatch: 'full' },
      { path: 'carrito', component: ClientePedidoComponent },
      { path: 'recomendaciones', component: RecomendacionesHomeComponent },
    ],
  },

  // ========== VENDEDOR ==========
  {
    path: 'vendedor',
    canActivate: [vendedorGuard],
    component: VendedorLayoutComponent, 
    children: [
      { path: '', redirectTo: 'pedidos', pathMatch: 'full' },
      { path: 'pedidos', component: VendedorPedidoComponent },
      { path: 'lista-vendedores', component: ListaVendedoresComponent },
       { path: 'borrar', component: BorrarComponent },
       {path: 'chat', component: ChatComponent},
    ],
  },

  // ========== SUPERVISOR ==========
  {
    path: 'supervisor',
    canActivate: [supervisorGuard],
    component: SupervisorLayoutComponent, 
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SupervisorDashboardComponent },
      { path: 'recomendaciones', component: SupervisorRecomendacionesComponent },
    ],
  },

  { path: '**', redirectTo: '/login' },
];
