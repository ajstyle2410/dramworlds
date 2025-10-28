import { ApiResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface ApiFetchOptions extends RequestInit {
  token?: string | null;
  parseJson?: boolean;
}

export class ApiError<T = unknown> extends Error {
  status: number;
  payload?: ApiResponse<T>;

  constructor(message: string, status: number, payload?: ApiResponse<T>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  if (!isJson) {
    throw new ApiError<T>(
      response.statusText || "Unexpected response from server.",
      response.status,
    );
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload;
}

export async function apiFetch<T>(
  endpoint: string,
  { token, parseJson = true, headers, ...init }: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const requestHeaders = new Headers({
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  if (headers) {
    new Headers(headers).forEach((value, key) => {
      requestHeaders.set(key, value);
    });
  }

  if (init.body && !(init.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
  });

  if (!parseJson) {
    return {
      success: response.ok,
      message: response.ok ? undefined : response.statusText,
      data: null as T,
    } as ApiResponse<T>;
  }

  let payload: ApiResponse<T>;
  try {
    payload = await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError<T>(
      error instanceof Error ? error.message : "Invalid server response",
      response.status,
    );
  }

  if (!response.ok || !payload.success) {
    throw new ApiError<T>(
      payload.message ?? response.statusText ?? "Request failed",
      response.status,
      payload,
    );
  }

  return payload;
}

export function formatDate(dateInput: string | null | undefined): string {
  if (!dateInput) {
    return "TBD";
  }
  try {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return dateInput;
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateInput;
  }
}

export function formatRelative(dateInput: string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateInput);
}
