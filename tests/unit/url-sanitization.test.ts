import { sanitizeProductUrl } from '@/lib/ai-chat/rag';

describe('URL sanitization', () => {
  it('allows valid product paths', () => {
    expect(sanitizeProductUrl('https://offl.ir/product/123')).toBe('https://offl.ir/product/123');
  });

  it('blocks malicious external paths', () => {
    expect(sanitizeProductUrl('https://evil.com/phishing')).toBeNull();
  });
});
