import { Routes } from '@angular/router';

export const CLINICAL_EXAMS_ROUTES: Routes = [
  {
    path: '',
    title: 'Solicitar examen',
    loadComponent: () =>
      import('./presentation/views/exam-request/exam-request').then((m) => m.ExamRequest),
  },
  {
    path: ':examId',
    title: 'Registrar resultado',
    loadComponent: () =>
      import('./presentation/views/exam-detail/exam-detail').then((m) => m.ExamDetail),
  },
];
