import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

import { AuthService } from './services/auth.service';
import { PedidoService } from './services/pedido.service';
import { WebsocketService } from './services/websocket.service';


export const appConfig: ApplicationConfig = {
  providers: [
     provideRouter(
      routes
    ),
    provideHttpClient(
      withInterceptors([authInterceptor])  // ← AGREGAR withInterceptors
    ),
    importProvidersFrom(FormsModule),
    // Services
    AuthService,
    PedidoService,
    WebsocketService,
  ],
};
