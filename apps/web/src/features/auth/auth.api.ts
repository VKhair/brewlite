import { api } from "@/shared/api/http-client";
import type { Session } from "./session.types";

type Credentials = { email: string; password: string };
type Registration = Credentials & { fullName: string; phone?: string };

export function login(input: Credentials) {
  return api<Session>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: Registration) {
  return api<Session>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
