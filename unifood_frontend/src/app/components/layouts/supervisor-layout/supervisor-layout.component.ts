import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-supervisor-layout',
  imports: [RouterOutlet],
  templateUrl: './supervisor-layout.component.html',
  styleUrl: './../vendedor-layout/vendedor-layout.component.scss'
})
export class SupervisorLayoutComponent {

   constructor(
      private authService: AuthService,
      private router: Router
    ) {}

      logout(): void {
        Swal.fire({
          title: '¿Cerrar sesión?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, salir',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#5B9A97',
          cancelButtonColor: '#E76F51',
        }).then((result) => {
          if (result.isConfirmed) {
            this.authService.logout();
          }
        });
      }

}
