// API pública de IAM: lo único que otros contextos pueden importar.
export { IamStore } from './application/iam.store';
export { User } from './domain/model/user.entity';
export type { Role } from './domain/model/role';
export { authGuard } from './presentation/guards/auth.guard';
export { matchRole, roleGuard } from './presentation/guards/role.guard';
