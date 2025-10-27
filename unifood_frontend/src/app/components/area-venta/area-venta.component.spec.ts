import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaVentaComponent } from './area-venta.component';

describe('AreaVentaComponent', () => {
  let component: AreaVentaComponent;
  let fixture: ComponentFixture<AreaVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreaVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AreaVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
