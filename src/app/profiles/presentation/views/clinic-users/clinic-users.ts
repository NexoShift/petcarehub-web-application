
import { Component, effect, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import type { User } from '../../../../iam/domain/model/user.entity';
import { VeterinarianStore } from '../../../application/veterinarian.store';

import { VeterinarianProfileForm, type VeterinarianProfileFormSubmission, } from '../../components/veterinarian-profile-form/veterinarian-profile-form';

import type { CreateVeterinarianCommand } from '../../../domain/model/create-veterinarian.command';

import { CreateClinicMember } from '../../../../iam/presentation/components/create-clinic-member/create-clinic-member';

import { ClinicStore } from '../../../application/clinic.store';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Administrative view for managing IAM users
 * belonging to an authenticated clinic account.
 *
 * Member creation is delegated to IAM's reusable
 * CreateClinicMember component.
 */
@Component({
  selector: 'app-clinic-users',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    CreateClinicMember,
    Icon,
    VeterinarianProfileForm,
  ],
  templateUrl: './clinic-users.html',
  styleUrl: './clinic-users.css',
})
export class ClinicUsers {
  protected readonly iamStore = inject(IamStore);
  protected readonly clinicStore = inject(ClinicStore);

  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  /**
   * The authenticated clinic's institutional profile.
   */
  protected readonly clinic = this.clinicStore.clinic;

  /**
   * Most recently created IAM member.
   *
   * This is not the complete list of clinic users.
   */
  protected readonly lastCreatedMember = signal<User | null>(null);

  /**
   * Profile application store.
   */
  protected readonly veterinarianStore = inject(VeterinarianStore);

  /**
   * Registration stages managed by the parent view.
   */
  protected readonly registrationStep = signal<'account' | 'profile'>('account');

  /**
   * IAM user whose professional profile is being registered.
   *
   * The user is retained when the profile request fails,
   * preventing duplicate account creation.
   */
  protected readonly pendingMember = signal<User | null>(null);

  /**
   * Indicates whether a profile creation request is running.
   */
  protected readonly creatingProfile = signal(false);

  /**
   * Localized error displayed after a failed profile request.
   */
  protected readonly profileError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const currentUser = this.iamStore.currentUser();

      if (currentUser && currentUser.hasRole('ROLE_CLINIC_ADMIN')) {
        this.clinicStore.loadByAccountId(currentUser.accountId);
      }
    });
  }

  /**
   * Moves to professional profile registration after
   * the IAM member account has been created.
   *
   * @param user - Newly registered IAM member.
   */
  protected onMemberCreated(user: User): void {
    this.lastCreatedMember.set(user);
    this.pendingMember.set(user);

    this.registrationStep.set('profile');
    this.profileError.set(null);

    this.snackBar.open(
      this.translate.instant('profiles.clinicUsers.accountCreated'),
      this.translate.instant('profiles.clinicMembers.close'),
      { duration: 4000 },
    );
  }

  /**
   * Opens the registration panel for the current clinic.
   */
  protected openMemberForm(drawer: MatDrawer): void {
    const clinic = this.clinic();
    const currentUser = this.iamStore.currentUser();

    if (
      !clinic ||
      !currentUser ||
      !currentUser.hasRole('ROLE_CLINIC_ADMIN') ||
      currentUser.accountId !== clinic.accountId
    ) {
      return;
    }

    if (this.pendingMember()) {
      this.registrationStep.set('profile');
    } else {
      this.registrationStep.set('account');
    }

    void drawer.open();
  }

  /**
   * Registers a professional profile for a previously
   * created IAM veterinarian member.
   *
   * @param values - Validated professional form values.
   * @param drawer - Registration panel.
   */
  protected createVeterinarianProfile(
    values: VeterinarianProfileFormSubmission,
    drawer: MatDrawer,
  ): void {
    const member = this.pendingMember();
    const clinic = this.clinic();
    const currentUser = this.iamStore.currentUser();

    if (!member || !clinic || !currentUser || this.creatingProfile()) {
      return;
    }

    if (
      !currentUser.hasRole('ROLE_CLINIC_ADMIN') ||
      currentUser.accountId !== clinic.accountId ||
      member.accountId !== clinic.accountId
    ) {
      this.profileError.set('profiles.clinicUsers.profileNotAuthorized');
      return;
    }

    const command: CreateVeterinarianCommand = {
      userId: member.id,
      clinicId: clinic.id,
      email: member.email,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phoneNumber,
      sex: values.sex,
      licenseNumber: values.licenseNumber,
      specialty: values.specialty,
    };

    this.creatingProfile.set(true);
    this.profileError.set(null);

    this.veterinarianStore.create(command, values.image).subscribe({
      next: () => {
        this.creatingProfile.set(false);

        this.pendingMember.set(null);
        this.registrationStep.set('account');

        this.snackBar.open(
          this.translate.instant('profiles.clinicUsers.profileCreated'),
          this.translate.instant('profiles.clinicMembers.close'),
          { duration: 4500 },
        );

        void drawer.close();
      },
      error: () => {
        this.creatingProfile.set(false);
        this.profileError.set('profiles.clinicUsers.profileCreateError');
      },
    });
  }

  /**
   * Closes the panel without deleting an already
   * registered IAM account.
   */
  protected cancelProfessionalProfile(drawer: MatDrawer): void {
    if (this.creatingProfile()) {
      return;
    }

    void drawer.close();
  }

  /**
   * Discards the pending form state to start another
   * registration. This does not delete the IAM user.
   */
  protected startNewRegistration(drawer: MatDrawer): void {
    if (this.creatingProfile()) {
      return;
    }

    this.pendingMember.set(null);
    this.profileError.set(null);
    this.registrationStep.set('account');

    void drawer.open();
  }

  /**
   * Closes the registration panel without creating a user.
   */
  protected closeMemberForm(drawer: MatDrawer): void {
    void drawer.close();
  }
}

