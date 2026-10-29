import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, IconName } from '../../components/icon/icon';
import { DashboardStore } from '../../../application/dashboard.store';
import { totalDoses, treatmentProgress, usagePercent } from '../../../domain/services/progress';
import { PetAvatar } from '../../components/pet-avatar/pet-avatar';
import { ProgressBar } from '../../components/progress-bar/progress-bar';

/** Un acceso rápido de "Herramientas y acciones rápidas". */
interface QuickAction {
  icon: IconName;
  title: string;
  text: string;
  link: string;
  path: string;
  badge?: string;
  ai?: boolean;   // los de IA llevan el ícono turquesa
}

/**
 * MW-04 · Panel del dueño de mascota.
 * Muestra sus mascotas, la alerta clínica, el tratamiento en curso, próximos eventos,
 * la cuota de IA del plan y el veterinario asignado.
 */
@Component({
  selector: 'app-owner-dashboard',
  imports: [RouterLink, Icon, PetAvatar, ProgressBar],
  templateUrl: './owner-dashboard.html',
  styleUrls: ['../dashboard.css', './owner-dashboard.css'],
})
export class OwnerDashboard implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly data = this.store.owner;

  // Cálculos derivados: se recalculan solos cuando cambian los datos del store
  protected readonly progress = computed(() => {
    const t = this.data()?.treatment;
    return t ? treatmentProgress(t) : 0;
  });
  protected readonly totalDoses = computed(() => {
    const t = this.data()?.treatment;
    return t ? totalDoses(t) : 0;
  });

  protected readonly usagePercent = usagePercent;

  protected readonly quickActions: QuickAction[] = [
    { icon: 'history', title: 'Historia clínica', text: 'Consultas previas, diagnósticos y vacunas', link: 'Ver expediente', path: '/medical-history' },
    { icon: 'pill', title: 'Tratamientos', text: 'Recetas activas y archivo de dispensación', link: '1 activo · Explorar', path: '/treatments' },
    { icon: 'sparkles', title: 'Explicar con IA', text: 'Aclarar diagnósticos y recetas complejas', link: 'Consultar asistente', path: '/ai-explain', badge: 'IA', ai: true },
    { icon: 'scan', title: 'Análisis visual', text: 'Triaje preliminar guiado por fotos y video', link: 'Iniciar captura', path: '/visual-analysis', badge: 'Visión' },
  ];

  ngOnInit(): void {
    this.store.loadOwner();
  }
}
