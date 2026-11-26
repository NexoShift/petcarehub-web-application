import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClinicPatient } from '../domain/model/clinic-patient.entity';
import { ProfileApi } from '../infrastructure/profile-api';
import { ClinicPatientStore } from './clinic-patient.store';

describe('ClinicPatientStore', () => {
  it('al registrar un paciente envía el id y el código de la mascota', () => {
    const registerClinicPatient = vi.fn().mockReturnValue(of(new ClinicPatient(1, 2, 7, new Date().toISOString())));
    TestBed.configureTestingModule({ providers: [{ provide: ProfileApi, useValue: { registerClinicPatient } }] });
    const store = TestBed.inject(ClinicPatientStore);

    store.register({ clinicId: 2, petId: 7, petCode: 'PET-ABCD1234' }).subscribe();

    expect(registerClinicPatient).toHaveBeenCalledWith(2, { petId: 7, petCode: 'PET-ABCD1234' });
  });
});
