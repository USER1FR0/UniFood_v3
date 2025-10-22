import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../../../components/chat/chat.component';

@Component({
  selector: 'app-chat-float',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Botón flotante del chat -->
    <div 
      class="chat-float-button" 
      [class.active]="isChatOpen"
      (click)="toggleChat()"
      [style]="{
        'position': 'fixed',
        'bottom': '30px',
        'right': '30px',
        'width': '60px',
        'height': '60px',
        'background': '#4a6cf7',
        'border-radius': '50%',
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'cursor': 'pointer',
        'box-shadow': '0 4px 20px rgba(74, 108, 247, 0.3)',
        'z-index': '1000',
        'transition': 'all 0.3s ease',
        'border': 'none',
        'outline': 'none',
        'color': 'white',
        'font-size': '24px'
      }"
      (mouseenter)="isHovered = true"
      (mouseleave)="isHovered = false"
    >
      <div class="chat-icon">💬</div>
      <span 
        *ngIf="unreadMessages > 0" 
        class="unread-badge"
        [style]="{
          'position': 'absolute',
          'top': '-5px',
          'right': '-5px',
          'background': '#ff4757',
          'color': 'white',
          'border-radius': '50%',
          'width': '24px',
          'height': '24px',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-size': '12px',
          'font-weight': 'bold',
          'animation': 'bounce 2s infinite'
        }"
      >{{ unreadMessages }}</span>
    </div>

    <!-- Contenedor del chat -->
    <div 
      class="chat-float-container"
      [class.open]="isChatOpen"
      [style]="{
        'position': 'fixed',
        'bottom': '100px',
        'right': isChatOpen ? '30px' : '-500px',
        'width': '400px',
        'max-height': '70vh',
        'background': '#ffffff',
        'border-radius': '12px',
        'box-shadow': '0 5px 25px rgba(0, 0, 0, 0.1)',
        'display': 'flex',
        'flex-direction': 'column',
        'z-index': '999',
        'transition': 'all 0.3s ease',
        'opacity': isChatOpen ? '1' : '0',
        'visibility': isChatOpen ? 'visible' : 'hidden',
        'overflow': 'hidden'
      }"
    >
      <div class="chat-wrapper">
        <app-chat 
          (newMessage)="onNewMessage($event)"
          [style]="{
            'display': 'flex',
            'flex-direction': 'column',
            'height': '100%',
            'min-height': '100%',
            'border-radius': '12px',
            'overflow': 'hidden'
          }"
        >
          <div class="chat-content">
            <div class="chat-scrollable" #messagesContainer>
              <ng-content></ng-content>
            </div>
          </div>
        </app-chat>
      </div>
    </div>
    
    <style>
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      
      /* Estilos para el contenedor del chat */
      .chat-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 70vh;
      }
      
      .chat-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .chat-scrollable {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #ccc #f1f1f1;
        padding: 15px;
      }
      
      .chat-float-container {
        ::ng-deep .chat-container {
          border-radius: 0;
          height: 100%;
          max-height: none;
          margin: 0;
          box-shadow: none;
          width: 100%;
        }
        
        ::ng-deep .chat-header {
          position: sticky;
          top: 0;
          z-index: 10;
          border-radius: 0;
        }
        
        ::ng-deep .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        ::ng-deep .chat-header {
          flex-shrink: 0;
          position: relative;
          z-index: 10;
          background: #4a6cf7;
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        ::ng-deep .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          max-height: none;
          min-height: 100px;
        }
        
        ::ng-deep .chat-input {
          flex-shrink: 0;
          background: white;
          padding: 15px;
          border-top: 1px solid #e9ecef;
        }
      }
      
      /* Estilos responsivos */
      @media (max-width: 480px) {
        .chat-float-button {
          width: 50px !important;
          height: 50px !important;
          bottom: 20px !important;
          right: 20px !important;
        }
        
        .chat-float-container {
          width: calc(100% - 40px) !important;
          max-height: 80vh !important;
          bottom: 90px !important;
          right: -100% !important;
          
          &.open {
            right: 20px !important;
          }
          
          ::ng-deep .chat-container {
            max-height: 80vh;
          }
          
          ::ng-deep .chat-messages {
            max-height: calc(80vh - 120px);
          }
        }
      }
    </style>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ChatFloatComponent implements OnInit, AfterViewInit {
  isChatOpen = false;
  unreadMessages = 0;
  isHovered = false;
  
  // Referencia al contenedor de mensajes
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.unreadMessages = 0;
      this.scrollToBottom();
    }
  }

  // Manejar nuevo mensaje
  onNewMessage(event: any): void {
    if (!this.isChatOpen) {
      this.unreadMessages++;
    } else {
      // Si el chat está abierto, hacer scroll al fondo
      this.scrollToBottom();
    }
  }
  
  // Simular mensaje nuevo
  simulateNewMessage(): void {
    if (!this.isChatOpen) {
      this.unreadMessages++;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        setTimeout(() => {
          const container = this.messagesContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    } catch(err) { 
      console.error('Error scrolling to bottom:', err);
    }
  }
}
