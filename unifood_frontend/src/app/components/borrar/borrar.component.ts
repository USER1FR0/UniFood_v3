import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-borrar',
  imports: [],
  templateUrl: './borrar.component.html',
  styleUrl: './borrar.component.scss'
})
export class BorrarComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
