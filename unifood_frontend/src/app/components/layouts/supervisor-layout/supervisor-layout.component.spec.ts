import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorLayoutComponent } from './supervisor-layout.component';

describe('SupervisorLayoutComponent', () => {
  let component: SupervisorLayoutComponent;
  let fixture: ComponentFixture<SupervisorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupervisorLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupervisorLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
