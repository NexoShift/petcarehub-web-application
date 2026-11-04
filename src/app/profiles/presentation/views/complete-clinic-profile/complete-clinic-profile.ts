
import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { ClinicStore } from '../../../application/clinic.store';

import { ClinicForm, ClinicFormSubmission } from '../../components/clinic-form/clinic-form';

import type { CreateClinicCommand } from '../../../domain/model/create-clinic.command';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Allows a clinic administrator to complete the clinic profile.
 */
@Component({
  selector: 'app-complete-clinic-profile',
  imports: [RouterLink, MatCardModule, MatProgressSpinnerModule, TranslatePipe, ClinicForm, Icon],
  templateUrl: './complete-clinic-profile.html',
  styleUrl: './complete-clinic-profile.css',
})
export class CompleteClinicProfile {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly iamStore = inject(IamStore);
  protected readonly clinicStore = inject(ClinicStore);

  constructor() {
    effect(() => {
      const accountId = this.iamStore.currentUser()?.accountId;

      if (accountId != null) {
        this.clinicStore.loadByAccountId(accountId);
      }
    });
  }

  /**
   * Registers the institutional profile for the authenticated account.
   */
  protected registerClinic(value: ClinicFormSubmission): void {
    const accountId = this.iamStore.currentUser()?.accountId;

    if (accountId == null || !this.clinicStore.profileNotFound() || this.clinicStore.loading()) {
      return;
    }

    const command: CreateClinicCommand = {
      accountId,
      name: value.name,
      ruc: value.ruc,
      address: value.address,
      phoneNumber: value.phoneNumber,
      description: value.description,
    };

    this.clinicStore.create(command, value.image).subscribe({
      next: () => {
        this.notify('profiles.clinic.created');
        void this.router.navigate(['/profiles/clinic']);
      },
      error: () => {
        this.notify('profiles.clinic.createError');
      },
    });
  }

  /**
   * Returns to the authenticated dashboard.
   */
  protected cancel(): void {
    void this.router.navigate(['/home']);
  }

  private notify(key: string): void {
    this.snackBar.open(
      this.translate.instant(key),
      this.translate.instant('profiles.clinic.close'),
      { duration: 4000 },
    );
  }
}

