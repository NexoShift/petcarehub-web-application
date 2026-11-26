export const environment = {
  /** Versión que se muestra en el menú; se cambia en cada release. */
  appVersion: '1.1.0',
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  // Profile endpoints
  profilePetOwnersEndpointPath: '/pet-owners',
  profilePetsEndpointPath: '/pets',
  profileVeterinariansEndpointPath: '/veterinarians',
  profileClinicsEndpointPath: '/clinics',
  profileClinicPatientsEndpointPath: '/patients',
  profileConsultingRoomsEndpointPath: '/consulting-rooms',
  profileConsultingRoomAssignmentsEndpointPath: '/consulting-room-assignments',
  // Subscription endpoints
  subscriptionPlansEndpointPath: '/plans',
  subscriptionAccountsEndpointPath: '/accounts',
};
