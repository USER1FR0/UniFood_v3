import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendedorPedidoComponent } from './vendedor-pedido.component';

describe('VendedorPedidoComponent', () => {
  let component: VendedorPedidoComponent;
  let fixture: ComponentFixture<VendedorPedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorPedidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendedorPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
