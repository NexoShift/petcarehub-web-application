import { User } from './user.entity';

describe('User', () => {
  it('reconoce a un veterinario por su rol', () => {
    const user = new User(1, 1, 'CLINIC', 'vet@petcare.com', ['ROLE_CLINIC_ADMIN', 'ROLE_VETERINARIAN']);
    expect(user.isVeterinarian).toBe(true);
    expect(user.isPetOwner).toBe(false);
  });

  it('un dueño no es veterinario', () => {
    const user = new User(2, 2, 'PET_OWNER', 'ana@correo.com', ['ROLE_PET_OWNER']);
    expect(user.isVeterinarian).toBe(false);
    expect(user.hasRole('ROLE_PET_OWNER')).toBe(true);
  });
});
