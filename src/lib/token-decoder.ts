export interface DecodedToken {
  userId?: number;
  role?: number;
  subRole?: string;
  exp?: number;
  iat?: number;
  sequenceId?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  cellphone?: string;
  [key: string]: any;
}

export const decodeJWT = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Check if token should be refreshed (less than 1 minute until expiry)
 */
export const shouldRefreshToken = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return false;

  const currentTime = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp - currentTime;

  // Refresh if less than 1 minute until expiry
  return timeUntilExpiry < 60;
};

/**
 * Check if refresh token is still valid
 */
export const isRefreshTokenValid = (token: string): boolean => {
  return !isTokenExpired(token);
};
