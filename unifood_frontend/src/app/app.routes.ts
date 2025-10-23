import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BorrarComponent } from './components/borrar/borrar.component';
import { authGuard } from './guards/auth.guard';
import { MenuComponent } from './components/menu/menu.component';
import { ListaVendedoresComponent } from './components/lista-vendedores/lista-vendedores.component';
import { CrearVendedorComponent } from './components/crear-vendedor/crear-vendedor.component';
import { AreaVentaComponent } from './components/area-venta/area-venta.component';
import { CategoriaComponent } from './components/categoria/categoria.component';

export const routes: Routes = [
    {path: '', redirectTo: 'lista-vendedores', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'borrar', component: BorrarComponent, canActivate: [authGuard]},
    {path: 'menu', component: MenuComponent},
    {path: 'lista-vendedores', component: ListaVendedoresComponent},
    {path: 'crear-vendedor', component: CrearVendedorComponent},
    {path: 'crear-area-venta', component: AreaVentaComponent},
    {path: 'crear-categoria', component: CategoriaComponent},
    {path: '**', redirectTo: 'lista-vendedores' }
];
