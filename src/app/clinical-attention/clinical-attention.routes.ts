import { Routes } from '@angular/router';

export const CLINICAL_ATTENTION_ROUTES: Routes = [
  {
    path: '',
    title: 'Consultas clínicas',
    loadComponent: () =>
      import('./presentation/views/consultation-list/consultation-list').then(
        (m) => m.ConsultationList,
      ),
  },
  {
    // Before ':consultationId' so "new" is not read as an id
    path: 'new',
    title: 'Nueva consulta',
    loadComponent: () =>
      import('./presentation/views/consultation-new/consultation-new').then(
        (m) => m.ConsultationNew,
      ),
  },
  {
    path: ':consultationId',
    title: 'Consulta clínica',
    loadComponent: () =>
      import('./presentation/views/consultation-workspace/consultation-workspace').then(
        (m) => m.ConsultationWorkspace,
      ),
  },
];

/** Dueño: consultas de sus mascotas, solo lectura (menú "Consultas"). */
export const OWNER_CONSULTATIONS_ROUTES: Routes = [
  {
    path: '',
    title: 'Consultas de mis mascotas',
    loadComponent: () =>
      import('./presentation/views/owner-consultations/owner-consultations').then(
        (m) => m.OwnerConsultations,
      ),
  },
  {
    path: ':consultationId',
    title: 'Consulta clínica',
    loadComponent: () =>
      import('./presentation/views/owner-consultation-detail/owner-consultation-detail').then(
        (m) => m.OwnerConsultationDetail,
      ),
  },
];
