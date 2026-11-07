import { Routes } from '@angular/router';
import { roleGuard } from '../../iam/presentation/guards/role.guard';

/**
 * Loads the existing pet owner profile view.
 */
const petOwnerProfile = () =>
  import('./views/pet-owner-profile/pet-owner-profile').then((m) => m.PetOwnerProfile);

/**
 * Loads the existing pet owner registration view.
 */
const completePetOwnerProfile = () =>
  import('./views/complete-pet-owner-profile/complete-pet-owner-profile').then(
    (m) => m.CompletePetOwnerProfile,
  );

const petList = () => import('./views/pet-list/pet-list').then((m) => m.PetList);

const petCreate = () => import('./views/pet-create/pet-create').then((m) => m.PetCreate);

const petDetail = () => import('./views/pet-detail/pet-detail').then((m) => m.PetDetail);

const clinicProfile = () =>
  import('./views/clinic-profile/clinic-profile').then((m) => m.ClinicProfile);

const completeClinicProfile = () =>
  import('./views/complete-clinic-profile/complete-clinic-profile').then(
    (m) => m.CompleteClinicProfile,
  );

const clinicUsers = () => import('./views/clinic-users/clinic-users').then((m) => m.ClinicUsers);

const clinicVeterinarians = () =>
  import('./views/clinic-veterinarians/clinic-veterinarians').then((m) => m.ClinicVeterinarians);

const veterinarianProfile = () =>
  import('./views/veterinarian-profile/veterinarian-profile').then((m) => m.VeterinarianProfile);

const clinicConsultingRooms = () =>
  import('./views/clinic-consulting-rooms/clinic-consulting-rooms').then(
    (m) => m.ClinicConsultingRooms,
  );

const clinicPatients = () =>
  import('./views/clinic-patients/clinic-patients').then((m) => m.ClinicPatients);

/**
 * Temporary view for features not yet implemented.
 *
 * @remarks
 * Each route will load its own component as the
 * corresponding Presentation block is completed.
 */
const comingSoon = () =>
  import('../../shared/presentation/views/coming-soon/coming-soon').then((m) => m.ComingSoon);

/**
 * Routes for the Profile bounded context.
 */
export const profileRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/home',
  },

  // --------------------------------------------------
  // Pet Owner
  // --------------------------------------------------

  {
    path: 'pet-owner',
    canActivate: [roleGuard('ROLE_PET_OWNER')],
    loadComponent: petOwnerProfile,
  },
  {
    path: 'pet-owner/complete',
    canActivate: [roleGuard('ROLE_PET_OWNER')],
    loadComponent: completePetOwnerProfile,
  },

  // --------------------------------------------------
  // Pets
  // --------------------------------------------------

  {
    path: 'pets',
    canActivate: [roleGuard('ROLE_PET_OWNER')],
    loadComponent: petList,
  },
  {
    path: 'pets/new',
    canActivate: [roleGuard('ROLE_PET_OWNER')],
    loadComponent: petCreate,
  },
  {
    path: 'pets/:petId',
    canActivate: [roleGuard('ROLE_PET_OWNER')],
    loadComponent: petDetail,
  },

  // --------------------------------------------------
  // Clinic
  // --------------------------------------------------

  {
    path: 'clinic',
    canActivate: [roleGuard('ROLE_CLINIC_ADMIN')],
    loadComponent: clinicProfile,
  },
  {
    path: 'clinic/complete',
    canActivate: [roleGuard('ROLE_CLINIC_ADMIN')],
    loadComponent: completeClinicProfile,
  },

  // --------------------------------------------------
  // Clinic Administration
  // --------------------------------------------------

  {
    path: 'clinic/users',
    canActivate: [roleGuard('ROLE_CLINIC_ADMIN')],
    loadComponent: clinicUsers,
  },
  {
    path: 'clinic/veterinarians',
    canActivate: [roleGuard('ROLE_CLINIC_ADMIN')],
    loadComponent: clinicVeterinarians,
  },
  {
    path: 'clinic/patients',
    canActivate: [roleGuard('ROLE_VETERINARIAN')],
    loadComponent: clinicPatients,
  },
  {
    path: 'clinic/consulting-rooms',
    canActivate: [roleGuard('ROLE_CLINIC_ADMIN')],
    loadComponent: clinicConsultingRooms,
  },
  {
    path: 'clinic/consulting-rooms/:roomId/assignments',
    redirectTo: '/profiles/clinic/consulting-rooms',
  },

  // --------------------------------------------------
  // Veterinarian
  // --------------------------------------------------

  {
    path: 'veterinarian',
    canActivate: [roleGuard('ROLE_VETERINARIAN')],
    loadComponent: veterinarianProfile,
  },
];
