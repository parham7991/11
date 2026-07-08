export const cookieName = process.env.NEXT_PUBLIC_COCKIES;
export const accessTokenExpires = Date.now() + 4 * 60 * 1000;

export function parseSessionCookie(cookie: string) {
  try {
    // Decode URL-encoded cookie if needed
    const decodedCookie = decodeURIComponent(cookie);
    const session = JSON.parse(decodedCookie);
    return session;
  } catch {
    // If decodeURIComponent fails, try parsing directly
    try {
      const session = JSON.parse(cookie);
      return session;
    } catch {
      throw new Error('Failed to parse session cookie');
    }
  }
}

// check if the access token is expired
export function isSessionExpired(accessTokenExpires: number) {
  return Date.now() > accessTokenExpires;
}
