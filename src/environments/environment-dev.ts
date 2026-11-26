export const environment = {
  /** Versión que se muestra en el menú; se cambia en cada release. */
  appVersion: '2.0.1',
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
  /** Client ID web de Google (termina en .apps.googleusercontent.com). Vacío = sin botón de Google. */
  googleClientId: '436854976303-cr980uen1lj550mnkh1ecd1vc985f8pp.apps.googleusercontent.com',
};
