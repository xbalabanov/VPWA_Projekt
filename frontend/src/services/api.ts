import type { ApiResponse } from '../types/api';

// Zatiaľ adresa lokálneho backendu.
const API_BASE_URL = 'http://localhost:3333/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(payload: unknown): string {
  if (isObject(payload)) {
    if (typeof payload.message === 'string') {
      return payload.message;
    }

    // Adonis pri validácii vracia pole errors.
    if (Array.isArray(payload.errors)) {
      const firstError: unknown = payload.errors[0];

      if (isObject(firstError) && typeof firstError.message === 'string') {
        return firstError.message;
      }
    }
  }

  return 'Požiadavka na server zlyhala.';
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return isObject(value) && 'data' in value;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload), response.status, payload);
  }

  if (!isApiResponse(payload)) {
    throw new ApiError(
      'Server vrátil odpoveď bez očakávaného poľa data.',
      response.status,
      payload,
    );
  }

  return payload.data as T;
}
