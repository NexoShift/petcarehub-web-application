
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '@ngx-translate/core';

import { Clinic } from '../../../domain/model/clinic.entity';
import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Data submitted by the clinic registration or editing form.
 */
export interface ClinicFormSubmission {
  name: string;
  ruc: string | null;
  address: string | null;
  phoneNumber: string | null;
  description: string | null;
  image: File | null;
}

/**
 * Reusable form for clinic registration and profile editing.
 */
@Component({
  selector: 'app-clinic-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    Icon,
  ],
  templateUrl: './clinic-form.html',
  styleUrl: './clinic-form.css',
})
export class ClinicForm {
  private readonly fb = inject(FormBuilder);

  readonly clinic = input<Clinic | null>(null);
  readonly saving = input(false);

  readonly submitted = output<ClinicFormSubmission>();
  readonly cancelled = output<void>();

  protected readonly selectedImage = signal<File | null>(null);
  protected readonly imageError = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    ruc: ['', Validators.pattern(/^$|^\d{11}$/)],
    address: [''],
    phoneNumber: [''],
    description: [''],
  });

  constructor() {
    effect(() => {
      const clinic = this.clinic();

      if (!clinic) {
        return;
      }

      this.form.reset({
        name: clinic.name,
        ruc: clinic.ruc ?? '',
        address: clinic.address ?? '',
        phoneNumber: clinic.phoneNumber ?? '',
        description: clinic.description ?? '',
      });
    });
  }

  /**
   * Validates an optional clinic image.
   */
  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedImage.set(null);
    this.imageError.set(false);

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) || file.size > maxSize) {
      this.imageError.set(true);
      input.value = '';
      return;
    }

    this.selectedImage.set(file);
  }

  /**
   * Emits validated clinic information.
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

    const optional = (text: string): string | null => text.trim() || null;

    this.submitted.emit({
      name,
      ruc: optional(value.ruc),
      address: optional(value.address),
      phoneNumber: optional(value.phoneNumber),
      description: optional(value.description),
      image: this.clinic() ? null : this.selectedImage(),
    });
  }
}

