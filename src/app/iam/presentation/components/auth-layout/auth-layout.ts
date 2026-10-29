import { Component, computed, input } from '@angular/core';

/**
 * Marco de las pantallas de acceso: foto a la izquierda y formulario a la derecha.
 * variant="sign-in" (MW-01) y variant="sign-up" (MW-02) solo cambian la foto y el texto.
 */
@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  readonly variant = input<'sign-in' | 'sign-up'>('sign-in');

  protected readonly content = computed(() => this.variant() === 'sign-in'
    ? {
        image: 'images/login-vet.png',
        alt: 'Veterinaria revisando a un perro en consulta',
        claim: 'La historia clínica de tu mascota, completa y en cualquier veterinaria.',
      }
    : {
        image: 'images/register-vet.png',
        alt: 'Veterinaria con un perro en la clínica',
        claim: 'Historias clínicas interoperables y asistencia inteligente para el bienestar animal.',
      });

  protected readonly features = ['Historia clínica centralizada', 'IA validada por veterinarios', 'Web y móvil'];
}
