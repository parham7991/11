declare module 'persian-number';

declare module 'js-cookie' {
  export interface CookieAttributes {
    expires?: number | Date | undefined;
    path?: string | undefined;
    domain?: string | undefined;
    secure?: boolean | undefined;
    sameSite?: 'strict' | 'lax' | 'none' | undefined;
  }

  export interface CookiesStatic {
    get(name: string): string | undefined;
    set(name: string, value: string | object, options?: CookieAttributes): string | undefined;
    remove(name: string, options?: CookieAttributes): void;
    withAttributes(attributes: CookieAttributes): CookiesStatic;
    withConverter(converter: {
      read?(value: string, name: string): string;
      write?(value: string, name: string): string;
    }): CookiesStatic;
  }

  const Cookies: CookiesStatic;
  export default Cookies;
  export const get: CookiesStatic['get'];
  export const set: CookiesStatic['set'];
  export const remove: CookiesStatic['remove'];
}
