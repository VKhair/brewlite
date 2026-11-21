export type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};
export type Session = { access_token: string; user: User };
