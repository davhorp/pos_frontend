import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentVaultComponent } from './document-vault.component';

describe('DocumentVaultComponent', () => {
  let component: DocumentVaultComponent;
  let fixture: ComponentFixture<DocumentVaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentVaultComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentVaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
