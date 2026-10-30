import { Component, computed, input } from '@angular/core';

/**
 * Foto redonda de la mascota. Si no hay foto, muestra la inicial sobre un color
 * que depende del nombre (así Max y Luna siempre tienen su propio color).
 */
const COLORS = ['#0BC3BD', '#023A65', '#F79009', '#7A5AF8', '#EE46BC', '#12B76A'];

@Component({
  selector: 'app-pet-avatar',
  template: `
    @if (photoUrl()) {
      <img [src]="photoUrl()" [alt]="name()" [style.width.px]="size()" [style.height.px]="size()">
    } @else {
      <span class="initial" [style.width.px]="size()" [style.height.px]="size()" [style.background]="color()"
            [style.font-size.px]="size() * 0.42">{{ name().charAt(0) }}</span>
    }
    @if (online()) { <span class="online"></span> }
  `,
  styles: `
    :host { position: relative; display: inline-flex; flex: none; }
    img, .initial { border-radius: 14px; object-fit: cover; box-shadow: 0 4px 10px -4px rgba(3, 43, 89, 0.35); }
    .initial { display: grid; place-items: center; color: #fff; font-weight: 600; }
    .online { position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; border: 2px solid #fff; border-radius: 50%; background: #0BC3BD; }
  `,
})
export class PetAvatar {
  readonly name = input.required<string>();
  readonly photoUrl = input<string | undefined>();
  readonly size = input(48);
  readonly online = input(false);

  // Suma los códigos de las letras del nombre y elige un color de la lista.
  protected readonly color = computed(() => {
    const sum = [...this.name()].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return COLORS[sum % COLORS.length];
  });
}
