'use client';

import axios, { AxiosError } from 'axios';
import type { CreateQuoteRequest, CreateQuoteResponse } from '@altan/shared';
import { API_BASE_URL } from '../env';

/** Browser axios instance for public mutations (quote submission). */
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

export interface NormalizedError {
  message: string;
  /** HTTP status, when available. */
  status?: number;
  /** Field-level validation messages keyed by field, if the API returned them. */
  fields?: Record<string, string>;
}

/** Normalize an axios error into a predictable shape for the UI. */
export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw.join(' ') : (raw ?? err.message);
    return { message, status };
  }
  return { message: err instanceof Error ? err.message : 'Unexpected error' };
}

/** `POST /quote-requests` — submit a public RFQ. */
export async function submitQuoteRequest(
  payload: CreateQuoteRequest,
): Promise<CreateQuoteResponse> {
  const { data } = await httpClient.post<CreateQuoteResponse>('/quote-requests', payload);
  return data;
}
