import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, Usuario } from '../models/auth.model';
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioStorage());
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, datos)
      .pipe(
        tap((response: LoginResponse) => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
          this.usuarioSubject.next(response.usuario);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }

  obtenerToken(): string | null {
    const token = localStorage.getItem('token');
    return token;
  }

  obtenerUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    const usuario = this.obtenerUsuario();
    const autenticado = !!(token && usuario);
    
    return autenticado;
  }

  verificarToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/verificar`);
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`);
  }

  esSupervisor(): boolean {
    return this.usuarioSubject.value?.rol === 'supervisor';
  }

  esVendedor(): boolean {
    return this.usuarioSubject.value?.rol === 'vendedor';
  }

  esCliente(): boolean {
    return this.usuarioSubject.value?.rol === 'cliente';
  }

  tieneRol(roles: string[]): boolean {
    const usuario = this.usuarioSubject.value;
    return usuario ? roles.includes(usuario.rol) : false;
  }

  private obtenerUsuarioStorage(): Usuario | null {
    const usuarioStr = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    
    if (usuarioStr && token) {
      return JSON.parse(usuarioStr);
    }
    return null;
  }
}