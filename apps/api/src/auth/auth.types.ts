export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}
export interface AuthRequest {
  headers: { authorization?: string };
  user: AuthUser;
}
