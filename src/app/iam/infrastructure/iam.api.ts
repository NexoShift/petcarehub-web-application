import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MessageResponse } from '../../shared/domain/message-response';
import { AuthenticatedUserResponse } from './resources/authenticated-user.response';
import { PasswordRecoveryRequest } from './resources/password-recovery.request';
import { PasswordResetRequest } from './resources/password-reset.request';
import { SignInRequest } from './resources/sign-in.request';
import { SignUpRequest } from './resources/sign-up.request';
import { UserResponse } from './resources/user.response';
import { CreateMemberUserRequest } from './resources/create-member-user.request';
import { ChangePasswordRequest } from './resources/change-password.request';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IamApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  signIn(body: SignInRequest) {
    return this.http.post<AuthenticatedUserResponse>(
      `${this.baseUrl}/authentication/sign-in`,
      body,
    );
  }

  signUp(body: SignUpRequest) {
    return this.http.post<UserResponse>(`${this.baseUrl}/authentication/sign-up`, body);
  }

  me() {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/me`);
  }

  requestPasswordRecovery(body: PasswordRecoveryRequest) {
    return this.http.post<MessageResponse>(
      `${this.baseUrl}/authentication/password-recovery`,
      body,
    );
  }

  resetPassword(body: PasswordResetRequest) {
    return this.http.post<MessageResponse>(`${this.baseUrl}/authentication/password-reset`, body);
  }

  changePassword(userId: number, body: ChangePasswordRequest) {
    return this.http.put<MessageResponse>(`${this.baseUrl}/users/${userId}/password`, body);
  }

  createMember(accountId: number, request: CreateMemberUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/accounts/${accountId}/users`, request);
  }
}
