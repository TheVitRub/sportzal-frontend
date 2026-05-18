import { api } from '@shared/api/api';
import type { AuthResponse, User } from '../model/types';

export class SessionService {
  static register(payload: { email: string; name: string; password: string }) {
    return api<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static login(payload: { email: string; password: string }) {
    return api<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static me() {
    return api<User>('/api/v1/auth/me');
  }
}

