import { Routes } from '@angular/router';

export const CLINICAL_EXAMS_ROUTES: Routes = [
  {
    path: '',
    title: 'Laboratorio',
    loadComponent: () =>
      import('./presentation/views/exam-worklist/exam-worklist').then((m) => m.ExamWorklist),
  },
  {
    // Antes de ':examId' para que "request" no se lea como un id
    path: 'request',
    title: 'Solicitar examen',
    loadComponent: () =>
      import('./presentation/views/exam-request/exam-request').then((m) => m.ExamRequest),
  },
  {
    path: ':examId',
    title: 'Detalle del examen',
    loadComponent: () =>
      import('./presentation/views/exam-detail/exam-detail').then((m) => m.ExamDetail),
  },
];

/** Dueño: exámenes y resultados validados de sus mascotas (menú "Exámenes y resultados"). */
export const OWNER_EXAMS_ROUTES: Routes = [
  {
    path: '',
    title: 'Exámenes y resultados',
    loadComponent: () =>
      import('./presentation/views/owner-exams/owner-exams').then((m) => m.OwnerExams),
  },
];
