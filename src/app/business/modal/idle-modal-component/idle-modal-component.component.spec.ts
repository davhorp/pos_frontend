import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdleModalComponentComponent } from './idle-modal-component.component';

describe('IdleModalComponentComponent', () => {
  let component: IdleModalComponentComponent;
  let fixture: ComponentFixture<IdleModalComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdleModalComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IdleModalComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
