import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatService: jasmine.SpyObj<ChatService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'connect', 'disconnect', 'sendMessage', 'onMessage', 'onRecommendations', 
      'onConnectionStatus', 'onError', 'getChatHistory'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    await TestBed.configureTestingModule({
      imports: [ChatComponent, HttpClientTestingModule],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Mock observables
    chatService.onMessage.and.returnValue(of());
    chatService.onRecommendations.and.returnValue(of());
    chatService.onConnectionStatus.and.returnValue(of(true));
    chatService.onError.and.returnValue(of());
    chatService.getChatHistory.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize chat with welcome message', () => {
    component.ngOnInit();
    expect(component.messages.length).toBeGreaterThan(0);
    expect(component.messages[0].isUser).toBeFalse();
    expect(component.messages[0].content).toContain('Hola');
  });

  it('should generate session ID on init', () => {
    component.ngOnInit();
    expect(component.sessionId).toBeTruthy();
    expect(component.sessionId).toContain('chat_');
  });

  it('should send message when sendMessage is called', () => {
    component.newMessage = 'Test message';
    component.sendMessage();
    
    expect(chatService.sendMessage).toHaveBeenCalledWith({
      mensaje: 'Test message',
      sessionId: component.sessionId
    });
  });

  it('should not send empty message', () => {
    component.newMessage = '';
    component.sendMessage();
    
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle Enter key press', () => {
    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    component.newMessage = 'Test message';
    
    component.onKeyPress(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(chatService.sendMessage).toHaveBeenCalled();
  });

  it('should clear chat when clearChat is called', () => {
    component.messages = [
      { id: 1, content: 'Test', isUser: true, timestamp: new Date(), sessionId: 'test' }
    ];
    component.recommendations = [{ producto_id: 1, nombre: 'Test', precio: 10 }];
    
    component.clearChat();
    
    expect(component.messages.length).toBe(1); // Welcome message
    expect(component.recommendations.length).toBe(0);
    expect(chatService.disconnect).toHaveBeenCalled();
  });

  it('should select recommendation', () => {
    const recommendation = {
      producto_id: 1,
      nombre: 'Test Product',
      precio: 15.99
    };
    
    component.selectRecommendation(recommendation);
    
    expect(component.newMessage).toContain('Test Product');
  });
});
