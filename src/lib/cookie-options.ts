/**
 * Get cookie options based on environment
 * - In production with .off.ir domain: uses domain option for cross-subdomain sharing
 * - In localhost/Vercel preview: no domain option (works on current host)
 */
export const getCookieOptions = (expires: number = 7) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNewvitaDomain = hostname.includes('newvita.ir');

  const baseOptions: {
    expires: number;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    domain?: string;
  } = {
    expires,
    secure: isProduction || hostname.includes('vercel.app'),
    sameSite: 'lax',
  };

  // Only set domain for production newvita.ir domains
  if (isProduction && isNewvitaDomain) {
    baseOptions.domain = '.off.ir';
  }

  return baseOptions;
};

/**
 * Get cookie removal options based on environment
 */
export const getCookieRemoveOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNewvitaDomain = hostname.includes('newvita.ir');

  // Only use domain option for production newvita.ir domains
  if (isProduction && isNewvitaDomain) {
    return { domain: '.off.ir', path: '/' };
  }

  return { path: '/' };
};
