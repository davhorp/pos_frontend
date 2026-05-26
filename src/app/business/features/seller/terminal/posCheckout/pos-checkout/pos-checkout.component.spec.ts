import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosCheckoutComponent } from './pos-checkout.component';

describe('PosCheckoutComponent', () => {
  let component: PosCheckoutComponent;
  let fixture: ComponentFixture<PosCheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosCheckoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PosCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
