import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageStore } from '../../../application/language.store';
import { Icon } from '../../components/icon/icon';
import { DashboardStore } from '../../../application/dashboard.store';
import { TodayPatient } from '../../../domain/model/dashboard/vet-dashboard';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { PetAvatar } from '../../components/pet-avatar/pet-avatar';

/** Pestañas del filtro de "Pacientes de hoy". */
type SpeciesFilter = 'Todos' | TodayPatient['species'];

/**
 * MW-05 · Panel del veterinario de guardia.
 * Indicadores del día, pacientes de hoy con filtro por especie, exámenes por revisar,
 * consultas recientes y la sugerencia del asistente clínico IA.
 */
@Component({
  selector: 'app-vet-dashboard',
  imports: [RouterLink, Icon, KpiCard, PetAvatar, TranslatePipe],
  templateUrl: './vet-dashboard.html',
  styleUrls: ['../dashboard.css', './vet-dashboard.css'],
})
export class VetDashboard implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly data = this.store.vet;

  private readonly language = inject(LanguageStore);

  /** Clave de "Buenos días / tardes / noches" según la hora de la computadora. */
  protected readonly greeting = signal((() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'dashboard.vet.morning';
    if (hour < 19) return 'dashboard.vet.afternoon';
    return 'dashboard.vet.evening';
  })());

  /**
   * Fecha de hoy en el idioma elegido, con la primera letra en mayúscula:
   * "Jueves, 29 de octubre de 2026" o "Thursday, October 29, 2026". Cambia sola al cambiar de idioma.
   */
  protected readonly today = computed(() => {
    const text = new Intl.DateTimeFormat(this.language.locale(), { dateStyle: 'full' }).format(new Date());
    return text.charAt(0).toUpperCase() + text.slice(1);
  });

  // ----- Filtro de especie -----
  protected readonly filters: SpeciesFilter[] = ['Todos', 'Canino', 'Felino'];
  protected readonly filter = signal<SpeciesFilter>('Todos');

  /** Cuántos pacientes hay por pestaña, para mostrar "Caninos (2)". */
  protected readonly counts = computed(() => {
    const patients = this.data()?.patients ?? [];
    return {
      Todos: patients.length,
      Canino: patients.filter(p => p.species === 'Canino').length,
      Felino: patients.filter(p => p.species === 'Felino').length,
    };
  });

  /** Lista que se muestra: cambia sola cuando cambias de pestaña. */
  protected readonly visiblePatients = computed(() => {
    const patients = this.data()?.patients ?? [];
    const f = this.filter();
    return f === 'Todos' ? patients : patients.filter(p => p.species === f);
  });

  /** Clave de i18n de cada pestaña. */
  protected filterLabel(f: SpeciesFilter): string {
    return f === 'Todos' ? 'dashboard.vet.filters.all' : f === 'Canino' ? 'dashboard.vet.filters.dogs' : 'dashboard.vet.filters.cats';
  }

  ngOnInit(): void {
    this.store.loadVet();
  }
}
