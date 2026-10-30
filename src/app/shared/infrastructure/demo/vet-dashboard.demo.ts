import { VetDashboard } from '../../domain/model/dashboard/vet-dashboard';

/**
 * Datos de demostración, copiados del Figma (MW-05, panel del veterinario).
 * Se reemplazan por el backend cuando existan Clinical Attention y Clinical Exams.
 */
export const VET_DASHBOARD_DEMO: VetDashboard = {
  vetLastName: 'Mendoza',
  clinic: 'VetSur · Sede Miraflores',
  scheduledToday: 3,
  waitingNow: 1,
  syncedAt: '10:24 AM',
  kpis: [
    // Los textos de los indicadores son claves de i18n (el backend solo mandará los números)
    { label: 'dashboard.vet.kpi.attended', value: 4, unit: 'dashboard.vet.kpi.patients', hint: 'dashboard.vet.kpi.vsYesterday', icon: 'users' },
    { label: 'dashboard.vet.kpi.waiting', value: 1, unit: 'dashboard.vet.kpi.inTriage', hint: 'dashboard.vet.kpi.priority', icon: 'clock', highlight: true },
    { label: 'dashboard.vet.kpi.ongoing', value: 1, unit: 'Box 2', hint: 'dashboard.vet.kpi.inCare', icon: 'stethoscope' },
    { label: 'dashboard.vet.kpi.pendingExams', value: 3, unit: 'dashboard.vet.kpi.orders', hint: 'dashboard.vet.kpi.labImaging', icon: 'flask' },
  ],
  patients: [
    {
      code: '#PET-97420', name: 'Rocky', species: 'Canino', breed: 'Bulldog Francés', ageYears: 4, weightKg: 12.1,
      ownerName: 'Valeria Ríos', ownerPhone: '912-345-678',
      status: 'waiting', statusText: 'En sala de espera · Turno 10:30 AM (llegó hace 12 min)',
      noteTitle: 'Motivo de ingreso',
      note: 'Control dermatológico y otitis externa recurrente. Tutor refiere prurito auricular intenso de 48 h.',
      primaryAction: 'Iniciar consulta',
    },
    {
      code: '#PET-98102', name: 'Max', species: 'Canino', breed: 'Golden Retriever', ageYears: 3, weightKg: 28.5,
      ownerName: 'Roberto García', ownerPhone: '987-654-321',
      status: 'alert', statusText: 'Alergia: Penicilina · Tratamiento activo · Día 3/7',
      noteTitle: 'Última evolución (12 Sep 2026)',
      note: 'Pododermatitis de contacto en miembro torácico derecho (MAD). Respuesta favorable a antiséptico tópico.',
      primaryAction: 'Nueva consulta',
    },
    {
      code: '#PET-98105', name: 'Luna', species: 'Felino', breed: 'Siamés Tradicional', ageYears: 2, weightKg: 3.8,
      ownerName: 'Roberto García', ownerPhone: '987-654-321',
      status: 'ok', statusText: 'Plan sanitario al día · Próx. desparasitación interna en 15 días',
      noteTitle: 'Última atención (18 Ago 2026)',
      note: 'Revacunación Triple Felina y control ponderal. Estado mucoso y condición corporal óptima (3/5).',
      primaryAction: 'Nueva consulta',
    },
  ],
  exams: [
    { name: 'Citología cutánea', patient: 'Max (Golden)', lab: 'VetLab Central', status: 'En proceso' },
    { name: 'Perfil bioquímico', patient: 'Luna (Siamés)', lab: 'VetLab Diag.', status: 'Solicitado' },
    { name: 'Radiografía torácica', patient: 'Rocky (Bulldog)', lab: 'Centro Imagen', status: 'Solicitado' },
  ],
  recent: [
    { patient: 'Max', reason: 'Pododermatitis', date: '12 Sep 2026 · Dr. F. Mendoza' },
    { patient: 'Luna', reason: 'Control vacunal', date: '10 Sep 2026 · Dr. F. Mendoza' },
    { patient: 'Rocky', reason: 'Otitis externa', date: '05 Sep 2026 · Dr. F. Mendoza' },
  ],
  aiSuggestion: {
    text: 'Protocolo sugerido para Rocky: se detectó historial de otitis recurrente por Malassezia en julio. Considere hisopado de control antes de recetar corticoide.',
  },
};
