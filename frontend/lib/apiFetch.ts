import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await SecureStore.getItemAsync("authToken");

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    }
  );

  if (response.status === 401) {
    await SecureStore.deleteItemAsync("authToken");
    router.replace("/(auth)/login");
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.clone().json();
      if (body.error) message = body.error;
    } catch {}
    throw new ApiError(response.status, message);
  }

  return response;
}
