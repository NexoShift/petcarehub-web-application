import { HttpClient} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment} from '../../../enviroments/environment';
import { AuthenticatedUserResponse } from './resources/authenticated-user.response';
import { SignInRequest } from './resources/sign-in.request';
import {SignUpRequest } from './resources/sign-up.request';
import {UserResponse} from './resources/user.response';


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
}
