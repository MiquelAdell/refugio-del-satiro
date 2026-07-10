const API_BASE = import.meta.env.VITE_API_URL ?? "/ludoteca/api";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconegut" }));
    throw new Error(error.detail ?? error.error ?? `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconegut" }));
    throw new Error(error.detail ?? error.error ?? `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
