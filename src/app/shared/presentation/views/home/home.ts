import { Component, inject } from '@angular/core';
import { IamStore } from '../../../../iam';

/** Pantalla de inicio provisional; luego cada contexto añadirá sus accesos. */
@Component({
  selector: 'app-home',
  template: `
    <h1>Hola, {{ iam.currentUser()?.email }}</h1>
    <p>Tipo de cuenta: {{ iam.currentUser()?.accountType }}</p>
    <p>Roles: {{ iam.currentUser()?.roles?.join(', ') }}</p>
  `,
})
export class Home {
  protected readonly iam = inject(IamStore);
}
