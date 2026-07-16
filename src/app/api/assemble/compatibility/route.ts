/**
 * ════════════════════════════════════════════════════════════════
 * 🔌 /api/assemble/compatibility — بررسی سازگاری real-time
 * ════════════════════════════════════════════════════════════════
 *
 * استفاده:
 *   POST { parts: [{ category, id, specs }] }
 *   Response: { matrix: { buildable, score, errors, warnings, ... } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkFullCompatibility } from '@/lib/ai-chat/compatibility-checker';
import { verifyProducts } from '@/lib/ai-chat/api-verify';
import type { AssemblyPart } from '@/lib/ai-chat/assembler';
import { buildFullTelemetry, type TelemetryPart } from '@/lib/ai-chat/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const partsInput: AssemblyPart[] = Array.isArray(body?.parts) ? body.parts : [];
    const checkStock: boolean = body?.checkStock !== false; // پیش‌فرض: چک کن

    if (partsInput.length === 0) {
      return NextResponse.json({ ok: true, matrix: null });
    }

    let enrichedParts: AssemblyPart[] = partsInput;

    // بررسی real-time موجودی و قیمت
    if (checkStock) {
      const ids = partsInput.map((p) => p.id);
      const verifications = await verifyProducts(ids);
      enrichedParts = partsInput.map((part, i) => {
        const v = verifications[i];
        if (v && v.exists) {
          return {
            ...part,
            inStock: v.inStock,
            price: v.price || part.price,
            finalPrice: v.finalPrice || part.finalPrice,
            // specs رو با attributes واقعی ادغام کن (اگه داشت)
            specs: v.attributes?.length ? mergeSpecs(part.specs, v.attributes) : part.specs,
            // به‌روزرسانی socket/ramType از attributes
          };
        }
        return part;
      });
    }

    const matrix = checkFullCompatibility(enrichedParts);

    // ═════ محاسبهٔ کامل تله‌متری زنده (توان، Bottleneck، FPS، ...) ═════
    const telemetry = buildFullTelemetry(enrichedParts as unknown as TelemetryPart[]);

    // تبدیل Set به Array برای JSON
    return NextResponse.json({
      ok: true,
      matrix: {
        ...matrix,
        blockedPartIds: Array.from(matrix.blockedPartIds),
        unavailablePartIds: Array.from(matrix.unavailablePartIds),
      },
      telemetry,
      parts: enrichedParts,
    });
  } catch (e) {
    console.error('compatibility error:', e);
    return NextResponse.json({ error: 'خطا در بررسی سازگاری.' }, { status: 500 });
  }
}

function mergeSpecs(existingSpecs: any, attributes: any[]): any {
  const merged = { ...existingSpecs };
  for (const attr of attributes) {
    const title = String(attr?.title || '').trim();
    const value = String(attr?.value || '').trim();
    if (!title || !value) continue;

    // تشخیص socket
    if (title.includes('سوکت') || title.toLowerCase().includes('socket')) {
      merged.socket = value.includes('AM5')
        ? 'AM5'
        : value.includes('AM4')
          ? 'AM4'
          : value.includes('1700')
            ? 'LGA1700'
            : value.includes('1851')
              ? 'LGA1851'
              : value.includes('1200')
                ? 'LGA1200'
                : merged.socket;
    }
    // تشخیص DDR
    if (title.includes('DDR') || title.includes('حافظه') || title.includes('رم')) {
      if (value.includes('DDR5')) merged.ramType = 'DDR5';
      else if (value.includes('DDR4')) merged.ramType = 'DDR4';
      else if (value.includes('DDR3')) merged.ramType = 'DDR3';
    }
    // توان
    if (
      title.includes('توان') ||
      title.toLowerCase().includes('watt') ||
      title.toLowerCase().includes('w')
    ) {
      const w = parseInt(value);
      if (w >= 100 && w <= 2000) merged.wattage = w;
    }
    // فرکانس
    if (
      title.includes('فرکانس') ||
      title.toLowerCase().includes('frequency') ||
      title.includes('MHz')
    ) {
      const f = parseInt(value);
      if (f >= 1000 && f <= 10000) merged.frequency = f;
    }
    // ظرفیت
    if (title.includes('ظرفیت') || title.toLowerCase().includes('capacity')) {
      const c = parseInt(value);
      if (c >= 1 && c <= 10000) merged.capacity = c;
    }
  }
  return merged;
}
