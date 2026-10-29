import { OwnerDashboard } from '../../domain/model/dashboard/owner-dashboard';

/**
 * Datos de demostración, copiados del Figma (MW-04, panel del propietario).
 * Se usan mientras el backend no tenga los endpoints de Profiles y Clinical Attention.
 * Cuando existan, se borra este archivo y DashboardApi llama al backend.
 */
export const OWNER_DASHBOARD_DEMO: OwnerDashboard = {
  ownerFirstName: 'Roberto',
  verifiedBy: 'CMVP N° 8492 · Dr. Valdivia',
  pets: [
    {
      id: 1, name: 'Max', species: 'Canino', breed: 'Golden Retriever', ageYears: 3, weightKg: 28.5,
      active: true, verified: true,
      tags: [{ label: 'Vacunas al día', tone: 'success' }, { label: 'Alergia: Penicilina', tone: 'danger' }],
    },
    {
      id: 2, name: 'Luna', species: 'Felino', breed: 'Siamés', ageYears: 2, weightKg: 3.8,
      active: false, verified: false,
      tags: [{ label: 'Plan sanitario al día', tone: 'success' }, { label: 'Sin alertas', tone: 'neutral' }],
    },
  ],
  alert: {
    title: 'Alergia confirmada a Penicilina y betalactámicos',
    detail: 'Registrado formalmente por el Dr. Valdivia (CMVP 8492) en historia digital.',
    badge: 'CONTRAINDICADO',
  },
  treatment: {
    prescriptionCode: '#R-2026-89',
    route: 'Terapia oral',
    title: 'Dermatitis por contacto',
    prescribedBy: 'Dr. Francisco Mendoza · CMVP 9841',
    startedAt: '12 Sep 2026',
    totalDays: 7,
    currentDay: 3,
    dosesTaken: 6,
    medication: {
      name: 'Cefalexina 500 mg',
      posology: '1 tableta cada 12 horas con alimento',
      note: 'Antibiótico sistémico de primera elección',
      dosesPerDay: 2,
    },
    nextDose: 'Hoy, 08:00 PM',
  },
  events: [
    { day: '19', month: 'SEP', title: 'Control de seguimiento', detail: 'Evaluación dérmica Max', meta: '10:30 AM · Sede Central', badge: 'En 5 días' },
    { day: '27', month: 'JUL', title: 'Refuerzo de vacuna', detail: 'Antirrábica anual Luna', meta: 'Programado automático' },
  ],
  aiQuota: {
    plan: 'Plan Premium',
    cycle: '15 Sep – 15 Oct',
    renewsInDays: 26,
    usages: [
      { label: 'Explicaciones médicas', used: 6, limit: 15, hint: '9 consultas disponibles este mes' },
      { label: 'Análisis dérmico e imágenes', used: 2, limit: 5, hint: '3 cargas asistidas restantes' },
    ],
  },
  assignedVet: {
    name: 'Dr. Fernando Valdivia',
    role: 'Médico de cabecera asignado',
    clinic: 'Clínica PetCare Miraflores',
  },
};
