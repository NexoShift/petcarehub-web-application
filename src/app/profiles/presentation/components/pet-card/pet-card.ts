
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';

import { Pet } from '../../../domain/model/pet.entity';
import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays a pet summary card.
 */
@Component({
  selector: 'app-pet-card',
  imports: [RouterLink, MatCardModule, TranslatePipe, Icon],
  templateUrl: './pet-card.html',
  styleUrl: './pet-card.css',
})
export class PetCard {
  readonly pet = input.required<Pet>();
}

