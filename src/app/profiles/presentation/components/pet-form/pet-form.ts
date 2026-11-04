
import { Component, effect, inject, input, output, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { Pet } from '../../../domain/model/pet.entity';

import type { Species } from '../../../domain/model/species';
import type { PetSex } from '../../../domain/model/pet-sex';

/**
 * Data submitted by the reusable pet form.
 */
export interface PetFormSubmission {
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex | null;
  image: File | null;
}

/**
 * Provides a reusable form for pet registration and editing.
 */
@Component({
  selector: 'app-pet-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './pet-form.html',
  styleUrl: './pet-form.css',
})
export class PetForm {
  private readonly fb = inject(FormBuilder);

  readonly pet = input<Pet | null>(null);
  readonly saving = input(false);

  readonly submitted = output<PetFormSubmission>();
  readonly cancelled = output<void>();

  protected readonly selectedImage = signal<File | null>(null);
  protected readonly imageError = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    species: ['DOG' as Species, Validators.required],
    breed: [''],
    birthDate: [''],
    sex: ['' as '' | PetSex],
  });

  constructor() {
    effect(() => {
      const pet = this.pet();

      if (!pet) {
        return;
      }

      this.form.reset({
        name: pet.name,
        species: pet.species,
        breed: pet.breed ?? '',
        birthDate: pet.birthDate ?? '',
        sex: pet.sex ?? '',
      });

      this.selectedImage.set(null);
      this.imageError.set(false);
    });
  }

  /**
   * Validates an optional image selected for registration.
   */
  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.imageError.set(false);
    this.selectedImage.set(null);

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      this.imageError.set(true);
      input.value = '';
      return;
    }

    this.selectedImage.set(file);
  }

  /**
   * Emits validated pet information to the parent view.
   */
  protected submit(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const name = value.name.trim();

    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    if (value.birthDate && value.birthDate > new Date().toISOString().slice(0, 10)) {
      this.form.controls.birthDate.setErrors({ futureDate: true });
      return;
    }

    this.submitted.emit({
      name,
      species: value.species,
      breed: value.breed.trim() || null,
      birthDate: value.birthDate || null,
      sex: value.sex === '' ? null : value.sex,
      image: this.selectedImage(),
    });
  }
}

