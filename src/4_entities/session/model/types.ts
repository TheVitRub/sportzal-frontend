export type Role = 'admin' | 'user';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

