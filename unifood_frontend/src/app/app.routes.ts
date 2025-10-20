import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BorrarComponent } from './components/borrar/borrar.component';
import { authGuard } from './guards/auth.guard';
import { MenuComponent } from './components/menu/menu.component';
import { ListaVendedoresComponent } from './components/lista-vendedores/lista-vendedores.component';

export const routes: Routes = [
    {path: '', redirectTo: 'borrar', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'borrar', component: BorrarComponent, canActivate: [authGuard]},
    {path: 'menu', component: MenuComponent},
    {path: 'lista-vendedores', component: ListaVendedoresComponent},
    {path: '**', redirectTo: 'borrar' }
];
