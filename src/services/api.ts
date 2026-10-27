import { clearToken, getToken } from "@/services/token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let redirectingToLogin = false;

function redirectToLoginForExpiredSession(): void {
  clearToken();

  if (redirectingToLogin || window.location.pathname === "/login") {
    return;
  }

  redirectingToLogin = true;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.clone().json();

    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    // Some API errors do not return JSON.
  }

  return "";
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "API URL is not configured. Please contact the administrator.",
    );
  }

  const token = getToken();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const errorMessage = !response.ok ? await getErrorMessage(response) : "";

  const expiredToken =
    response.status === 401 ||
    (response.status === 403 && /invalid or expired token/i.test(errorMessage));

  if (expiredToken) {
    redirectToLoginForExpiredSession();

    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        errorMessage || "You do not have permission to access this resource.",
      );
    }

    throw new Error(
      errorMessage || `Request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
