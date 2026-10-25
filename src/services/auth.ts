import { clearToken, setToken } from "@/services/token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export async function login(credentials: LoginCredentials): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (response.status === 401) {
    throw new Error("Invalid email or password.");
  }

  if (!response.ok) {
    throw new Error("Login failed. Please try again.");
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("token" in data) ||
    typeof data.token !== "string" ||
    data.token.length === 0
  ) {
    throw new Error("The server returned an invalid login response.");
  }

  const result = data as LoginResponse;
  setToken(result.token);
}

export function logout(): void {
  clearToken();
}
