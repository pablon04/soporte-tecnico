import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Interfaz } from './interfaz';

describe('Interfaz', () => {
  let component: Interfaz;
  let fixture: ComponentFixture<Interfaz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Interfaz]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Interfaz);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
