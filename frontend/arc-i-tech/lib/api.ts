import { ApiResponse } from "@/types";

/**
 * The base API URL — uses env variable if provided.
 * Example: NEXT_PUBLIC_API_URL=https://api.arcitech.in
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Extended fetch options.
 */
export interface ApiFetchOptions extends RequestInit {
  token?: string | null;
  parseJson?: boolean;
}

/**
 * Unified error type for API handling.
 */
export class ApiError<T = unknown> extends Error {
  status: number;
  payload?: ApiResponse<T>;
  rawBody?: string;

  constructor(
    message: string,
    status: number,
    payload?: ApiResponse<T>,
    rawBody?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.rawBody = rawBody;
  }
}

/**
 * Parses server responses safely — handles both JSON and text fallbacks.
 */
async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type");
  const rawBody = await response.text();

  // Handle non-JSON (like HTML or plain text error pages)
  if (!contentType?.includes("application/json")) {
    throw new ApiError<T>(
      `Invalid JSON response (status ${response.status})`,
      response.status,
      undefined,
      rawBody
    );
  }

  try {
    return JSON.parse(rawBody) as ApiResponse<T>;
  } catch {
    throw new ApiError<T>(
      `Malformed JSON response (status ${response.status})`,
      response.status,
      undefined,
      rawBody
    );
  }
}

/**
 * Universal API fetch wrapper for all backend requests.
 */
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

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
  });

  // Handle no JSON parse case (for file downloads etc.)
  if (!parseJson) {
    return {
      success: response.ok,
      message: response.ok ? "OK" : response.statusText,
      data: null as T,
    } as ApiResponse<T>;
  }

  let payload: ApiResponse<T>;
  try {
    payload = await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError<T>(
      error instanceof Error ? error.message : "Invalid server response",
      response.status
    );
  }

  if (!response.ok || !payload.success) {
    throw new ApiError<T>(
      payload?.message ?? response.statusText ?? "Request failed",
      response.status,
      payload
    );
  }

  return payload;
}

/**
 * Utility to format ISO date string as DD MMM YYYY.
 */
export function formatDate(dateInput: string | null | undefined): string {
  if (!dateInput) return "TBD";
  try {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return dateInput;
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

/**
 * Formats a date relative to now (e.g., "2 hr ago").
 */
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
