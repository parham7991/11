import { normalizeText, validatePartCategory, isGenuineCpuCooler } from '@/lib/ai-chat/guardrails';

describe('guardrails', () => {
  it('detects fake cooler keywords', () => {
    expect(isGenuineCpuCooler('پایه خنک‌کننده لپ‌تاپ')).toBe(false);
    expect(isGenuineCpuCooler('کولپد')).toBe(false);
  });

  it('allows real CPU cooler', () => {
    expect(isGenuineCpuCooler('خنک‌کننده پردازنده DeepCool AK620')).toBe(true);
  });

  it('normalizes Persian text', () => {
    expect(normalizeText('کولر')).toContain('کولر');
  });

  it('rejects below-min-price accessories', () => {
    const result = validatePartCategory('cpu', { title: 'فن استوک', finalPrice: 50000 });
    expect(result.passed).toBe(false);
  });
});
