'use server';
import { parseSessionCookie } from './utils';
import { generateToken } from './fun';
import { cookies } from 'next/headers';

type Props = {
  url: string;
  options?: RequestInit;
  data?: unknown;
  cache?: RequestCache | undefined;
  method?: string | undefined;
  revalidate?: number;
  tag?: string;
  withFingerprint?: boolean;
  retry?: number;
  timeoutMs?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status: number) =>
  status === 408 || status === 417 || status === 425 || status === 429 || status >= 500;

const getErrorMessage = (res: any) =>
  res?.fa_message
    ? res.fa_message
    : res?.error
      ? res.error
      : res?.errors
        ? res.errors
        : res?.message
          ? res.message
          : 'مشکلی رخ داده است';

export async function fetchRequest({
  url,
  options,
  data,
  cache,
  method = 'GET',
  revalidate,
  tag,
  withFingerprint = false,
  retry,
  timeoutMs = 12000,
}: Props) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const normalizedMethod = method.toUpperCase();
  const maxAttempts = retry ?? (normalizedMethod === 'GET' ? 2 : 1);

  try {
    const cookieStore = await cookies();
    const rawSession = process.env.NEXT_PUBLIC_COCKIES
      ? cookieStore.get(process.env.NEXT_PUBLIC_COCKIES)?.value
      : undefined;
    const fingerprint = cookieStore.get('finger')?.value;

    let session: { accessToken?: string } | null = null;
    if (rawSession) {
      try {
        session = parseSessionCookie(rawSession);
      } catch {
        session = null;
      }
    }

    const jwtKey = await generateToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${jwtKey}`,
    };

    if (session?.accessToken) {
      headers['token'] = `${session.accessToken}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_SERVER_API_URL || '';
    const requestUrl = `${baseUrl}${url}${withFingerprint ? `?fingerprint=${fingerprint}` : ''}`;
    const body = data ? JSON.stringify(data) : undefined;

    let lastError: unknown;
    let lastResponseStatus: number | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(requestUrl, {
          ...options,
          method: normalizedMethod,
          headers: {
            ...options?.headers,
            ...headers,
          },
          next: {
            ...(tag ? { tags: [tag] } : null),
            ...(revalidate ? { revalidate } : null),
          },
          cache: cache || 'force-cache',
          ...(body ? { body } : null),
          signal: options?.signal ?? AbortSignal.timeout(timeoutMs),
        });

        lastResponseStatus = response.status;

        if (!response.ok) {
          const res = await response.json().catch(() => null);
          const error = new Error(getErrorMessage(res));
          lastError = error;

          if (attempt < maxAttempts && isRetryableStatus(response.status)) {
            await sleep(250 * attempt);
            continue;
          }

          console.log(response);
          throw error;
        }

        const res = await response.json();
        const duration = Date.now() - startTime;

        if (duration > 3000) {
          console.warn(`⚠️ [${requestId}] Slow request: ${duration}ms for ${url}`);
        } else {
          console.log(`✅ [${requestId}] Request completed successfully in ${duration}ms`);
        }

        return res;
      } catch (error: any) {
        lastError = error;

        if (attempt < maxAttempts && !lastResponseStatus) {
          await sleep(250 * attempt);
          continue;
        }

        throw error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('مشکلی رخ داده است');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${requestId}] Request failed after ${duration}ms:`, error);
    throw error;
  }
}

export const request = fetchRequest;

export async function safeRequest<T = unknown>(
  args: Props & { defaultValue?: T; log?: boolean }
): Promise<T | null> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  if (args?.log !== false) {
    console.log(`🛡️ [${requestId}] Starting safe request to: ${args.url}`);
  }

  try {
    const result = await fetchRequest(args);
    const duration = Date.now() - startTime;

    if (args?.log !== false) {
      if (duration > 3000) {
        console.warn(`⚠️ [${requestId}] Slow safe request: ${duration}ms for ${args.url}`);
      } else {
        console.log(`✅ [${requestId}] Safe request completed in ${duration}ms`);
      }
    }

    return result as T;
  } catch (err) {
    const duration = Date.now() - startTime;
    if (args?.log !== false) {
      console.error(`❌ [${requestId}] Safe request failed after ${duration}ms:`, err);
    }
    return (args?.defaultValue as T) ?? null;
  }
}
