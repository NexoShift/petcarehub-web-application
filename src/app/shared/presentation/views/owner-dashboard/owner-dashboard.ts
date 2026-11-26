import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon, IconName } from '../../components/icon/icon';
import { DashboardStore } from '../../../application/dashboard.store';
import { treatmentProgress, usagePercent } from '../../../domain/services/progress';
import { PetAvatar } from '../../components/pet-avatar/pet-avatar';
import { ProgressBar } from '../../components/progress-bar/progress-bar';

/** Un acceso rápido de "Herramientas y acciones rápidas". Los textos son claves de i18n. */
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
 * Muestra sus mascotas con su estado real, lo pendiente (consultas y exámenes),
 * la alerta prioritaria de su historia clínica, el tratamiento vigente con su receta, los últimos resultados validados, los créditos de IA
 * y el veterinario y la clínica de la última consulta.
 */
@Component({
  selector: 'app-owner-dashboard',
  imports: [DatePipe, RouterLink, Icon, PetAvatar, ProgressBar, TranslatePipe],
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

  protected readonly usagePercent = usagePercent;

  protected readonly quickActions: QuickAction[] = [
    { icon: 'history', title: 'dashboard.owner.quick.historyTitle', text: 'dashboard.owner.quick.historyText',
      link: 'dashboard.owner.quick.historyLink', path: '/medical-history' },
    { icon: 'pill', title: 'dashboard.owner.quick.treatmentsTitle', text: 'dashboard.owner.quick.treatmentsText',
      link: 'dashboard.owner.quick.treatmentsLink', path: '/treatments' },
    { icon: 'scan', title: 'dashboard.owner.quick.visualTitle', text: 'dashboard.owner.quick.visualText',
      link: 'dashboard.owner.quick.visualLink', path: '/visual-analysis', badge: 'dashboard.owner.quick.visualBadge' },
  ];

  ngOnInit(): void {
    void this.store.loadOwner();
  }
}
