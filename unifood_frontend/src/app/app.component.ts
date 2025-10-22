import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ChatFloatComponent } from "./shared/components/chat-float/chat-float.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatFloatComponent],
  template: `
    <router-outlet></router-outlet>
    <app-chat-float></app-chat-float>
  `,
  styles: []
})
export class AppComponent {
  title = 'unifood_frontend';
}
