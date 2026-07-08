/**
 * proxy-fetch.ts — fetch با پشتیبانی از پروکسی SOCKS5 (فقط سمت سرور، بدون پکیج خارجی)
 * ──────────────────────────────────────────────────────────────────
 * مسیر کار برای HTTPS از طریق SOCKS5:
 *   ۱) یک سوکت TCP خام از طریق SOCKS5 به مقصد باز می‌کنیم (socks.ts)
 *   ۲) روی همان سوکت یک لایهٔ TLS کامل برقرار می‌کنیم (با SNI و ALPN صحیح)
 *      و منتظر رویداد secureConnect می‌مانیم تا handshake واقعاً تمام شود.
 *   ۳) سپس درخواست HTTP را روی سوکت TLS آماده می‌فرستیم.
 *
 * این ترتیب از خطای «socket disconnected before secure TLS connection»
 * جلوگیری می‌کند، چون قبل از ارسال درخواست مطمئن می‌شویم TLS برقرار شده.
 * هیچ پکیج خارجی لازم نیست (فقط net/tls/http داخلی Node).
 * ──────────────────────────────────────────────────────────────────
 */

import http from 'http';
import tls from 'tls';
import net from 'net';
import { socks5Connect } from './socks';

type FetchFn = typeof fetch;

/** تجزیهٔ آدرس پروکسی SOCKS به اجزا */
function parseSocksUrl(url: string) {
  const m = url.match(/^socks(4a?|5h?):\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:/]+):(\d+)/i);
  if (!m) throw new Error(`آدرس پروکسی SOCKS نامعتبر است: ${url}`);
  return {
    username: m[2] ? decodeURIComponent(m[2]) : undefined,
    password: m[3] ? decodeURIComponent(m[3]) : undefined,
    host: m[4],
    port: Number(m[5]),
  };
}

/** برقراری TLS روی یک سوکت موجود و انتظار تا اتمام handshake */
function establishTls(rawSocket: net.Socket, servername: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const tlsSocket = tls.connect({
      socket: rawSocket,
      servername, // SNI
      ALPNProtocols: ['http/1.1'], // مهم برای Cloudflare/سرورهای مدرن
      // gateway/پروکسی‌های واسط ممکن است گواهی را تغییر ندهند؛ اعتبارسنجی کامل
      rejectUnauthorized: true,
    });
    const onError = (err: Error) => {
      tlsSocket.destroy();
      reject(err);
    };
    tlsSocket.once('secureConnect', () => {
      tlsSocket.removeListener('error', onError);
      resolve(tlsSocket);
    });
    tlsSocket.once('error', onError);
  });
}

/**
 * یک تابع fetch می‌سازد که در صورت فعال‌بودن پروکسی SOCKS از آن عبور می‌کند.
 */
export async function getProxyFetch(proxyUrl: string, useProxy: boolean): Promise<FetchFn> {
  if (!useProxy || !proxyUrl) return fetch;

  if (!/^socks/i.test(proxyUrl)) {
    console.warn('[ai-chat] فقط پروکسی SOCKS پشتیبانی می‌شود؛ از پروکسی صرف‌نظر شد.');
    return fetch;
  }

  let proxy: ReturnType<typeof parseSocksUrl>;
  try {
    proxy = parseSocksUrl(proxyUrl);
  } catch (e) {
    console.error('[ai-chat]', e);
    return fetch;
  }

  const proxiedFetch: FetchFn = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : (input as Request).url);
    const isHttps = url.protocol === 'https:';
    const destPort = url.port ? Number(url.port) : isHttps ? 443 : 80;

    // ۱) سوکت خام از طریق SOCKS5
    const rawSocket = await socks5Connect({
      proxyHost: proxy.host,
      proxyPort: proxy.port,
      username: proxy.username,
      password: proxy.password,
      destHost: url.hostname,
      destPort,
      timeoutMs: 20000,
    });

    // ۲) اگر HTTPS است، TLS را کامل برقرار کن و منتظر بمان
    let socket: net.Socket = rawSocket;
    if (isHttps) {
      try {
        socket = await establishTls(rawSocket, url.hostname);
      } catch (err) {
        rawSocket.destroy();
        throw err;
      }
    }

    // آماده‌سازی هدرها
    const method = (init?.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = new Headers(init.headers as HeadersInit);
      h.forEach((v, k) => {
        headers[k] = v;
      });
    }
    headers['host'] = url.host;
    headers['connection'] = 'close';

    const bodyStr =
      typeof init?.body === 'string'
        ? init.body
        : init?.body
          ? JSON.stringify(init.body)
          : undefined;
    if (bodyStr && headers['content-length'] === undefined) {
      headers['content-length'] = String(Buffer.byteLength(bodyStr));
    }

    // ۳) ارسال درخواست HTTP روی سوکتِ (احتمالاً TLS‌شدهٔ) آماده
    return new Promise<Response>((resolve, reject) => {
      const req = http.request(
        {
          method,
          path: url.pathname + url.search,
          headers,
          createConnection: () => socket, // سوکت از پیش آماده (خام یا TLS)
        } as http.RequestOptions,
        (res) => {
          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              res.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
              res.on('end', () => {
                try {
                  controller.close();
                } catch {}
              });
              res.on('error', (err) => controller.error(err));
            },
            cancel() {
              res.destroy();
            },
          });

          const resHeaders = new Headers();
          for (const [k, v] of Object.entries(res.headers)) {
            if (Array.isArray(v)) resHeaders.set(k, v.join(', '));
            else if (v) resHeaders.set(k, String(v));
          }

          resolve(
            new Response(stream, {
              status: res.statusCode || 200,
              statusText: res.statusMessage || '',
              headers: resHeaders,
            })
          );
        }
      );

      req.on('error', reject);
      socket.on('error', reject);

      const signal = init?.signal;
      if (signal) {
        if (signal.aborted) req.destroy(new Error('aborted'));
        else
          signal.addEventListener('abort', () => req.destroy(new Error('aborted')), {
            once: true,
          });
      }

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  };

  return proxiedFetch;
}
