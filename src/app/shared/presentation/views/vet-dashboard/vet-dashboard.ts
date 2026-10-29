import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink, Icon, KpiCard, PetAvatar],
  templateUrl: './vet-dashboard.html',
  styleUrls: ['../dashboard.css', './vet-dashboard.css'],
})
export class VetDashboard implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly data = this.store.vet;

  /** "Buenos días / tardes / noches" según la hora de la computadora. */
  protected readonly greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  /** Fecha de hoy en español con la primera letra en mayúscula, ej.: "Jueves, 29 de octubre de 2026". */
  protected readonly today = (() => {
    const text = new Intl.DateTimeFormat('es-PE', { dateStyle: 'full' }).format(new Date());
    return text.charAt(0).toUpperCase() + text.slice(1);
  })();

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

  protected filterLabel(f: SpeciesFilter): string {
    return f === 'Todos' ? 'Todos' : f === 'Canino' ? 'Caninos' : 'Felinos';
  }

  ngOnInit(): void {
    this.store.loadVet();
  }
}
