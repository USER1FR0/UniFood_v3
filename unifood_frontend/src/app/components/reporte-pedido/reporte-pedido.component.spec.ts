import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportePedidoComponent } from './reporte-pedido.component';

describe('ReportePedidoComponent', () => {
  let component: ReportePedidoComponent;
  let fixture: ComponentFixture<ReportePedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportePedidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportePedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
