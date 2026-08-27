import { apiRequest } from "@/services/api-client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export const authApi = {
  login: (input: { email: string; password: string }) =>
    apiRequest<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  register: (input: { name: string; email: string; password: string }) =>
    apiRequest<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () => apiRequest<void>("/api/auth/logout", { method: "POST" }),
  me: () => apiRequest<{ user: AuthUser }>("/api/auth/me"),
};
