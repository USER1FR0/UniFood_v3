import { Component,OnInit } from '@angular/core';
import { RouterOutlet,Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  title = 'UniFood';

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      const usuario = this.authService.obtenerUsuario();
      
      if (usuario?.rol === 'cliente') {
        this.router.navigate(['/cliente/carrito']);
      } else if (usuario?.rol === 'vendedor') {
        this.router.navigate(['/vendedor']);
      }
    } else {
      console.log('Usuario no autenticado');
    }
  }
}
