import { TestBed } from '@angular/core/testing';

import { ClientsBrokerService } from './clients-broker.service';

describe('ClientsBrokerService', () => {
  let service: ClientsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
