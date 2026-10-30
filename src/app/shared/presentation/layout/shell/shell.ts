import { Component, computed, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { IamStore } from '../../../../iam';
import { Icon, IconName } from '../../components/icon/icon';
import { LanguageSwitcher } from '../../components/language-switcher/language-switcher';

/**
 * Un enlace del menú lateral. label es una clave de public/i18n/*.json.
 * Si tiene children, se muestra como submenú desplegable (mat-expansion-panel).
 */
interface NavItem {
  label: string;
  icon: IconName;
  path?: string;
  children?: NavItem[];
}

/** Un grupo del menú con su título (puede ir sin título). */
interface NavSection {
  title?: string;
  items: NavItem[];
}

/*
 * Menús por rol. Cada pantalla nueva (Mis mascotas, Pacientes...) solo necesita su ruta:
 * el enlace ya está aquí. Mientras no exista, la ruta ** del Shell abre "Próximamente".
 */
const OWNER_MENU: NavSection[] = [
  {
    items: [
      { label: 'shell.menu.home', path: '/home', icon: 'home' },
      { label: 'shell.menu.pets', path: '/pets', icon: 'paw' },
      { label: 'shell.menu.medicalHistory', path: '/medical-history', icon: 'history' },
      { label: 'shell.menu.treatments', path: '/treatments', icon: 'pill' },
      { label: 'shell.menu.exams', path: '/exams', icon: 'flask' },
      { label: 'shell.menu.visualAnalysis', path: '/visual-analysis', icon: 'scan' },
      { label: 'shell.menu.aiExplain', path: '/ai-explain', icon: 'sparkles' },
    ],
  },
];
const OWNER_FOOTER: NavItem[] = [
  { label: 'shell.menu.myPlan', path: '/plan', icon: 'card' },
  { label: 'shell.menu.profile', path: '/profile', icon: 'user' },
];

const VET_MENU: NavSection[] = [
  {
    title: 'shell.sections.clinic',
    items: [
      { label: 'shell.menu.home', path: '/home', icon: 'home' },
      { label: 'shell.menu.patients', path: '/patients', icon: 'paw' },
      { label: 'shell.menu.consultations', path: '/consultations', icon: 'stethoscope' },
      { label: 'shell.menu.medicalHistory', path: '/medical-history', icon: 'history' },
      { label: 'shell.menu.laboratory', path: '/laboratory', icon: 'microscope' },
      { label: 'shell.menu.imaging', path: '/imaging', icon: 'image' },
      { label: 'shell.menu.aiAssistant', path: '/ai-assistant', icon: 'sparkles' },
      // Submenú: se abre solo si estás en una de sus páginas
      {
        label: 'shell.menu.admin',
        icon: 'building',
        children: [
          { label: 'shell.menu.clinic', path: '/clinic', icon: 'building' },
          { label: 'shell.menu.offices', path: '/offices', icon: 'list' },
          { label: 'shell.menu.planSubscription', path: '/plan', icon: 'card' },
        ],
      },
    ],
  },
];
const VET_FOOTER: NavItem[] = [{ label: 'shell.menu.profile', path: '/profile', icon: 'user' }];

/** Desde este ancho para abajo el menú lateral se esconde y se abre con ☰. */
const MOBILE = '(max-width: 1024px)';

/**
 * Marco de la app con sesión, hecho con Angular Material (igual que el Layout de QualiTrack):
 * - mat-toolbar fija arriba: ☰, marca, miga de pan, buscador (vet), idioma, campana y menú de usuario.
 * - mat-sidenav a la izquierda: menú por rol. En escritorio queda fijo (mode="side");
 *   en tablet/celular flota encima del contenido (mode="over") y se cierra al navegar.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe,
    MatToolbarModule, MatSidenavModule, MatButtonModule, MatMenuModule,
    MatExpansionModule, MatDividerModule, MatTooltipModule, MatRippleModule,
    Icon, LanguageSwitcher,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly iam = inject(IamStore);

  /** true en pantallas de 1024 px o menos. BreakpointObserver avisa cada vez que cambia. */
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly isMobile = toSignal(this.breakpoints.observe(MOBILE).pipe(map(s => s.matches)), {
    initialValue: this.breakpoints.isMatched(MOBILE),
  });

  /** ¿El usuario es veterinario? Decide qué menú y qué textos mostrar. */
  protected readonly isVet = computed(() => this.iam.currentUser()?.isVeterinarian ?? false);

  protected readonly menu = computed(() => (this.isVet() ? VET_MENU : OWNER_MENU));
  protected readonly footerMenu = computed(() => (this.isVet() ? VET_FOOTER : OWNER_FOOTER));
  protected readonly portalLabel = computed(() => (this.isVet() ? 'shell.portalVet' : 'shell.portalOwner'));
  protected readonly roleLabel = computed(() => (this.isVet() ? 'shell.roleVet' : 'shell.roleOwner'));

  /** Nombre a mostrar: por ahora la parte del correo antes de la @ (Profiles traerá el nombre real). */
  protected readonly displayName = computed(() => this.iam.currentUser()?.email.split('@')[0] ?? '');
  protected readonly initials = computed(() => this.displayName().slice(0, 2).toUpperCase());

  /** URL actual como señal, para la miga de pan y para abrir el submenú activo. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Clave del título de la página actual ("PetCare › Inicio"). */
  protected readonly pageTitle = computed(() => {
    const all = [...this.menu().flatMap(s => s.items.flatMap(i => i.children ?? [i])), ...this.footerMenu()];
    return all.find(item => item.path && this.url().startsWith(item.path))?.label ?? 'shell.menu.home';
  });

  /** ¿Alguno de los hijos del submenú es la página actual? Entonces el submenú se abre. */
  protected isGroupActive(item: NavItem): boolean {
    return (item.children ?? []).some(child => child.path && this.url().startsWith(child.path));
  }

  /** En celular el menú se cierra al tocar un enlace; en escritorio se queda abierto. */
  protected closeIfMobile(drawer: MatSidenav): void {
    if (this.isMobile()) drawer.close();
  }

  protected signOut(): void {
    this.iam.signOut();
    this.router.navigate(['/sign-in']);
  }
}
