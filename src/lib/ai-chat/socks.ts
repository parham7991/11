/**
 * socks.ts — کلاینت SOCKS5 خالص با ماژول‌های داخلی Node (بدون هیچ پکیج خارجی)
 * ──────────────────────────────────────────────────────────────────
 * یک سوکت TCP از طریق پروکسی SOCKS5 به مقصد باز می‌کند. از احراز هویت
 * username/password (RFC 1929) و اتصال به دامنه (نه فقط IP) پشتیبانی می‌کند.
 *
 * چرا native؟ تا نیازی به نصب undici/fetch-socks نباشد و روی هر هاستی
 * (حتی اشتراکی) بدون dependency اضافه کار کند.
 * ──────────────────────────────────────────────────────────────────
 */

import net from 'net';

export type SocksOptions = {
  proxyHost: string;
  proxyPort: number;
  username?: string;
  password?: string;
  destHost: string;
  destPort: number;
  timeoutMs?: number;
};

/**
 * یک سوکت TCP از طریق پروکسی SOCKS5 به مقصد برقرار می‌کند.
 * Promise یک net.Socket آماده برمی‌گرداند که می‌توان روی آن TLS سوار کرد.
 */
export function socks5Connect(opts: SocksOptions): Promise<net.Socket> {
  const { proxyHost, proxyPort, username, password, destHost, destPort } = opts;
  const timeoutMs = opts.timeoutMs ?? 15000;

  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: proxyHost, port: proxyPort });
    let stage: 'greeting' | 'auth' | 'request' = 'greeting';
    let settled = false;

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(err);
    };

    const timer = setTimeout(() => fail(new Error('SOCKS5: timeout')), timeoutMs);

    socket.once('error', fail);
    socket.once('connect', () => {
      // گام ۱: greeting — اعلام روش‌های احراز هویت پشتیبانی‌شده
      const methods = username ? [0x00, 0x02] : [0x00]; // 0x00=no-auth, 0x02=user/pass
      const greeting = Buffer.from([0x05, methods.length, ...methods]);
      socket.write(greeting);
    });

    socket.on('data', (chunk: Buffer) => {
      try {
        if (stage === 'greeting') {
          if (chunk.length < 2 || chunk[0] !== 0x05) {
            return fail(new Error('SOCKS5: پاسخ greeting نامعتبر'));
          }
          const method = chunk[1];
          if (method === 0x00) {
            // بدون احراز هویت → مستقیم درخواست connect
            stage = 'request';
            sendConnect();
          } else if (method === 0x02) {
            // احراز هویت username/password (RFC 1929)
            if (!username) return fail(new Error('SOCKS5: پروکسی نیازمند احراز هویت است'));
            stage = 'auth';
            const u = Buffer.from(username, 'utf8');
            const p = Buffer.from(password || '', 'utf8');
            const authBuf = Buffer.concat([
              Buffer.from([0x01, u.length]),
              u,
              Buffer.from([p.length]),
              p,
            ]);
            socket.write(authBuf);
          } else {
            return fail(new Error('SOCKS5: روش احراز هویت پشتیبانی نمی‌شود'));
          }
          return;
        }

        if (stage === 'auth') {
          if (chunk.length < 2 || chunk[1] !== 0x00) {
            return fail(new Error('SOCKS5: احراز هویت ناموفق (نام کاربری/رمز اشتباه؟)'));
          }
          stage = 'request';
          sendConnect();
          return;
        }

        if (stage === 'request') {
          if (chunk.length < 2 || chunk[0] !== 0x05) {
            return fail(new Error('SOCKS5: پاسخ connect نامعتبر'));
          }
          const rep = chunk[1];
          if (rep !== 0x00) {
            return fail(new Error(`SOCKS5: اتصال به مقصد ناموفق (کد ${rep})`));
          }
          // موفق! سوکت آمادهٔ استفاده است
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          socket.removeListener('error', fail);
          resolve(socket);
        }
      } catch (e) {
        fail(e as Error);
      }
    });

    // ارسال درخواست CONNECT با آدرس دامنه (ATYP=0x03)
    function sendConnect() {
      const host = Buffer.from(destHost, 'utf8');
      const portBuf = Buffer.alloc(2);
      portBuf.writeUInt16BE(destPort, 0);
      const req = Buffer.concat([
        Buffer.from([0x05, 0x01, 0x00, 0x03, host.length]),
        host,
        portBuf,
      ]);
      socket.write(req);
    }
  });
}
