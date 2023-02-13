import { TestBed } from '@angular/core/testing';

import { DbconService } from './dbcon.service';

describe('DbconService', () => {
  let service: DbconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
