import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { IamStore } from '../../../../iam';
import { Icon, IconName } from '../../components/icon/icon';

/** Un enlace del menú lateral. */
interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

/** Un grupo del menú con su título (puede ir sin título). */
interface NavSection {
  title?: string;
  items: NavItem[];
}

/*
 * Menús por rol. Cada pantalla nueva que hagas (Mis mascotas, Pacientes...) solo necesita
 * su ruta en app.routes.ts: el enlace ya está aquí. Mientras no exista, abre "Próximamente".
 */
const OWNER_MENU: NavSection[] = [
  {
    items: [
      { label: 'Inicio', path: '/home', icon: 'home' },
      { label: 'Mis mascotas', path: '/pets', icon: 'paw' },
      { label: 'Historia clínica', path: '/medical-history', icon: 'history' },
      { label: 'Tratamientos y recetas', path: '/treatments', icon: 'pill' },
      { label: 'Exámenes y resultados', path: '/exams', icon: 'flask' },
      { label: 'Análisis visual', path: '/visual-analysis', icon: 'scan' },
      { label: 'Explicar con IA', path: '/ai-explain', icon: 'sparkles' },
    ],
  },
];
const OWNER_FOOTER: NavItem[] = [
  { label: 'Mi plan', path: '/plan', icon: 'card' },
  { label: 'Perfil', path: '/profile', icon: 'user' },
];

const VET_MENU: NavSection[] = [
  {
    title: 'Clínica general',
    items: [
      { label: 'Inicio', path: '/home', icon: 'home' },
      { label: 'Pacientes', path: '/patients', icon: 'paw' },
      { label: 'Consultas', path: '/consultations', icon: 'stethoscope' },
      { label: 'Historia clínica', path: '/medical-history', icon: 'history' },
      { label: 'Laboratorio', path: '/laboratory', icon: 'microscope' },
      { label: 'Imagenología', path: '/imaging', icon: 'image' },
      { label: 'Asistente clínico', path: '/ai-assistant', icon: 'sparkles' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Clínica', path: '/clinic', icon: 'building' },
      { label: 'Consultorios', path: '/offices', icon: 'list' },
      { label: 'Plan y suscripción', path: '/plan', icon: 'card' },
    ],
  },
];
const VET_FOOTER: NavItem[] = [{ label: 'Perfil', path: '/profile', icon: 'user' }];

/**
 * Marco de la app con sesión: menú lateral navy + barra superior + contenido.
 * El menú cambia según el rol de la cuenta (dueño o veterinario).
 * En celular el menú se esconde y se abre con el botón de hamburguesa.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly iam = inject(IamStore);

  /** ¿El usuario es veterinario? Decide qué menú y qué textos mostrar. */
  protected readonly isVet = computed(() => this.iam.currentUser()?.isVeterinarian ?? false);

  protected readonly menu = computed(() => (this.isVet() ? VET_MENU : OWNER_MENU));
  protected readonly footerMenu = computed(() => (this.isVet() ? VET_FOOTER : OWNER_FOOTER));
  protected readonly portalLabel = computed(() => (this.isVet() ? 'Portal veterinario' : 'Portal propietario'));
  protected readonly roleLabel = computed(() => (this.isVet() ? 'Médico veterinario' : 'Dueño de mascota'));

  /** Nombre a mostrar: por ahora la parte del correo antes de la @ (Profiles traerá el nombre real). */
  protected readonly displayName = computed(() => this.iam.currentUser()?.email.split('@')[0] ?? '');
  protected readonly initials = computed(() => this.displayName().slice(0, 2).toUpperCase());

  /** URL actual como señal, para armar la miga de pan ("PetCare › Inicio"). */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly pageTitle = computed(() => {
    const all = [...this.menu().flatMap(s => s.items), ...this.footerMenu()];
    return all.find(item => this.url().startsWith(item.path))?.label ?? 'Inicio';
  });

  /** Menú abierto en celular. */
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.iam.signOut();
    this.router.navigate(['/sign-in']);
  }
}
