import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteProductosComponent } from './cliente-productos.component';

describe('ClienteProductosComponent', () => {
  let component: ClienteProductosComponent;
  let fixture: ComponentFixture<ClienteProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteProductosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
