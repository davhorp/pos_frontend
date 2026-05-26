import { TestBed } from '@angular/core/testing';

import { WebSerialPrintService } from './web-serial-print.service';

describe('WebSerialPrintService', () => {
  let service: WebSerialPrintService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebSerialPrintService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
