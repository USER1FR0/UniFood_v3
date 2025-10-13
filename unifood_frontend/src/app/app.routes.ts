import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BorrarComponent } from './components/borrar/borrar.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {path: '', redirectTo: 'borrar', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'borrar', component: BorrarComponent, canActivate: [authGuard]},
    {path: '**', redirectTo: 'borrar' }
];
