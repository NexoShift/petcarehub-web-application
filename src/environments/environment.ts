export const environment = {
  /** Versión que se muestra en el menú; se cambia en cada release. */
  appVersion: '2.0.0',
  production: true,
  apiBaseUrl: 'https://petcarehub-api.kindwave-02283cc0.westus2.azurecontainerapps.io/api/v1',
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
  googleClientId: '',
};
