import { TestBed } from '@angular/core/testing';

import { FormlyValidationService } from './formly-validation.service';

describe('FormlyValidationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FormlyValidationService = TestBed.get(FormlyValidationService);
    expect(service).toBeTruthy();
  });
});
