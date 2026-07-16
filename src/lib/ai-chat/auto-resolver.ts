/**
 * ════════════════════════════════════════════════════════════════
 * 🛠️ auto-resolver.ts — حل خودکار مشکلات سازگاری (v4)
 * ════════════════════════════════════════════════════════════════
 *
 * وقتی دو قطعه با هم ناسازگارن، این ماژول:
 *   ۱. قطعهٔ کم‌اهمیت‌تر رو حذف می‌کنه (بر اساس کاربری)
 *   ۲. جایگزین سازگار از همون دسته پیشنهاد می‌ده
 *   ۳. اگه جایگزین نیست، پیام "موجود نیست" + مدل پیشنهادی می‌ده
 *   ۴. توضیح می‌ده چرا این قطعه حذف شد
 *
 * استراتژی برای هر کاربری:
 *   - gaming:    GPU > CPU > Motherboard (اولویت به GPU)
 *   - editing:   CPU > GPU > Motherboard (اولویت به CPU)
 *   - streaming: CPU > GPU > Motherboard (اولویت به CPU)
 *   - office:    همهٔ قطعات مساوی
 *
 * ════════════════════════════════════════════════════════════════
 */

import type { AssemblyPart, CategoryCandidates } from './assembler';
import { CPU_DB, MB_CHIPSETS } from './parts-db';

// ════════════════════════════════════════════════════════════════
// 📋 نوع‌ها
// ════════════════════════════════════════════════════════════════

export interface ResolutionAction {
  /** نوع اقدام */
  type: 'replace' | 'remove' | 'keep' | 'suggest';
  /** قطعهٔ فعلی */
  current?: AssemblyPart;
  /** قطعهٔ جایگزین پیشنهادی */
  suggested?: AssemblyPart | SuggestedPart;
  /** دلیل */
  reason: string;
  /** پیام فارسی برای کاربر */
  userMessage: string;
  /** آیا این مشکل حل شد؟ */
  resolved: boolean;
  /** قطعه حذف شد؟ */
  removedPartId?: string | number;
  /** قطعه جایگزین شد؟ */
  newPartId?: string | number;
}

export interface SuggestedPart {
  /** نام پیشنهادی */
  name: string;
  /** مدل دقیق */
  model: string;
  /** دلیل پیشنهاد */
  reason: string;
  /** سوکت (برای CPU/MB) */
  socket?: string;
  /** نوع RAM (برای MB/RAM) */
  ramType?: string;
  /** تخمین قیمت */
  estimatedPrice?: string;
  /** وضعیت موجودی */
  availability: 'in_stock' | 'coming_soon' | 'check_website';
}

export interface ResolutionResult {
  /** قطعات اصلاح‌شده */
  parts: AssemblyPart[];
  /** اقدامات انجام‌شده */
  actions: ResolutionAction[];
  /** قطعاتی که حذف شدن */
  removedParts: Array<{ part: AssemblyPart; reason: string }>;
  /** قطعات پیشنهادی برای جایگزینی */
  suggestions: SuggestedPart[];
  /** پیام‌های کاربر */
  messages: Array<{
    severity: 'error' | 'warning' | 'info' | 'success';
    text: string;
  }>;
  /** آیا سیستم الان سازگاره؟ */
  resolved: boolean;
}

// ════════════════════════════════════════════════════════════════
// 🎯 اولویت قطعات بر اساس کاربری
// ════════════════════════════════════════════════════════════════

const PART_PRIORITY: Record<string, Record<string, number>> = {
  gaming: {
    gpu: 100, // GPU > CPU
    cpu: 90,
    motherboard: 70,
    ram: 60,
    psu: 80, // PSU خیلی مهم برای GPU
    storage: 40,
    case: 30,
  },
  editing: {
    cpu: 100, // CPU > GPU
    gpu: 85,
    motherboard: 70,
    ram: 90, // RAM خیلی مهم
    psu: 60,
    storage: 80, // Storage هم مهم
    case: 30,
  },
  streaming: {
    cpu: 100,
    gpu: 85,
    motherboard: 70,
    ram: 90,
    psu: 60,
    storage: 50,
    case: 30,
  },
  office: {
    cpu: 80,
    gpu: 60,
    motherboard: 80,
    ram: 80,
    psu: 70,
    storage: 70,
    case: 60,
  },
};

// ════════════════════════════════════════════════════════════════
// 🛠️ حل‌کنندهٔ اصلی
// ════════════════════════════════════════════════════════════════

export function autoResolve(
  parts: AssemblyPart[],
  candidates: Map<string, AssemblyPart[]>,
  useCase: string
): ResolutionResult {
  const actions: ResolutionAction[] = [];
  const removedParts: Array<{ part: AssemblyPart; reason: string }> = [];
  const suggestions: SuggestedPart[] = [];
  const messages: Array<{ severity: 'error' | 'warning' | 'info' | 'success'; text: string }> = [];
  let workingParts = [...parts];

  const priority = PART_PRIORITY[useCase] || PART_PRIORITY.gaming;

  // ═══════ قانون ۱: سوکت CPU ↔ مادربرد ═══════
  const cpu = workingParts.find((p) => p.category === 'cpu');
  const mb = workingParts.find((p) => p.category === 'motherboard');

  if (cpu && mb && cpu.specs?.socket && mb.specs?.socket && cpu.specs.socket !== mb.specs.socket) {
    const cpuPriority = priority.cpu || 50;
    const mbPriority = priority.motherboard || 50;

    if (cpuPriority > mbPriority) {
      // نگه‌داشتن CPU، جایگزینی مادربرد
      const result = resolveByKeepingCpu(cpu, mb, candidates.get('motherboard') || [], useCase);
      actions.push(...result.actions);
      removedParts.push(...result.removedParts);
      suggestions.push(...result.suggestions);
      messages.push(...result.messages);
      workingParts = workingParts.filter((p) => p.id !== mb.id);
      if (result.newPart) {
        workingParts = workingParts.map((p) =>
          p.category === 'motherboard' ? result.newPart! : p
        );
      }
    } else {
      // نگه‌داشتن مادربرد، جایگزینی CPU
      const result = resolveByKeepingMb(cpu, mb, candidates.get('cpu') || [], useCase);
      actions.push(...result.actions);
      removedParts.push(...result.removedParts);
      suggestions.push(...result.suggestions);
      messages.push(...result.messages);
      workingParts = workingParts.filter((p) => p.id !== cpu.id);
      if (result.newPart) {
        workingParts = workingParts.map((p) => (p.category === 'cpu' ? result.newPart! : p));
      }
    }
  }

  // ═══════ قانون ۲: نوع RAM ↔ مادربرد ═══════
  const updatedMb = workingParts.find((p) => p.category === 'motherboard');
  const ram = workingParts.find((p) => p.category === 'ram');
  if (
    updatedMb &&
    ram &&
    updatedMb.specs?.ramType &&
    ram.specs?.ramType &&
    updatedMb.specs.ramType !== ram.specs.ramType
  ) {
    const result = resolveRamMismatch(updatedMb, ram, candidates.get('ram') || []);
    actions.push(...result.actions);
    removedParts.push(...result.removedParts);
    suggestions.push(...result.suggestions);
    messages.push(...result.messages);
    workingParts = workingParts.filter((p) => p.id !== ram.id);
    if (result.newPart) {
      workingParts = workingParts.map((p) => (p.category === 'ram' ? result.newPart! : p));
    }
  }

  // ═══════ قانون ۳: توان PSU ═══════
  const updatedCpu = workingParts.find((p) => p.category === 'cpu');
  const gpu = workingParts.find((p) => p.category === 'gpu');
  const psu = workingParts.find((p) => p.category === 'psu');
  if (psu && psu.specs?.wattage) {
    const cpuTdp = (updatedCpu?.specs?.tdp as number) || 95;
    const gpuTdp = (gpu?.specs?.tdp as number) || 150;
    const required = Math.round(((cpuTdp + gpuTdp + 100) * 1.25) / 50) * 50;
    if (psu.specs.wattage < required) {
      const result = resolvePsuInsufficient(psu, updatedCpu, gpu, candidates.get('psu') || []);
      actions.push(...result.actions);
      removedParts.push(...result.removedParts);
      suggestions.push(...result.suggestions);
      messages.push(...result.messages);
      workingParts = workingParts.filter((p) => p.id !== psu.id);
      if (result.newPart) {
        workingParts = workingParts.map((p) => (p.category === 'psu' ? result.newPart! : p));
      }
    }
  }

  // ═══════ قانون ۴: کولر ↔ CPU (TDP) ═══════
  const cooler = workingParts.find((p) => p.category === 'cooler');
  const finalCpu = workingParts.find((p) => p.category === 'cpu');
  if (cooler && finalCpu && cooler.specs?.tdpRating && finalCpu.specs?.tdp) {
    if (cooler.specs.tdpRating < finalCpu.specs.tdp) {
      const result = resolveCoolerInsufficient(cooler, finalCpu, candidates.get('cooler') || []);
      actions.push(...result.actions);
      removedParts.push(...result.removedParts);
      suggestions.push(...result.suggestions);
      messages.push(...result.messages);
      workingParts = workingParts.filter((p) => p.id !== cooler.id);
      if (result.newPart) {
        workingParts = workingParts.map((p) => (p.category === 'cooler' ? result.newPart! : p));
      }
    }
  }

  // ═══════ قانون ۵: قطعات ناموجود ═══════
  for (const part of workingParts) {
    if (!part.inStock || part.price === 0) {
      const replacement = (candidates.get(part.category) || [])
        .filter((c) => c.inStock && c.finalPrice > 0 && String(c.id) !== String(part.id))
        .sort((a, b) => {
          const aDist = Math.abs((a.finalPrice || 0) - (part.finalPrice || part.price || 0));
          const bDist = Math.abs((b.finalPrice || 0) - (part.finalPrice || part.price || 0));
          return b.confidence - a.confidence || aDist - bDist;
        })[0];

      if (replacement) {
        actions.push({
          type: 'suggest',
          current: part,
          suggested: replacement,
          reason: part.price === 0 ? 'price_unavailable_replacement' : 'out_of_stock_replacement',
          userMessage: `${part.categoryLabel} «${part.name}» الان موجود نیست؛ می‌تونی «${replacement.name}» را مستقیم به سیستم اضافه/جایگزین کنی.`,
          resolved: true,
          removedPartId: part.id,
          newPartId: replacement.id,
        });
        messages.push({
          severity: 'info',
          text: `➕ جایگزین موجود برای ${part.categoryLabel}: «${replacement.name}» آمادهٔ افزودن به سیستم است.`,
        });
      } else {
        // تولید پیشنهاد برای قطعهٔ ناموجود
        const sug = suggestReplacementForUnavailable(part, useCase);
        suggestions.push(sug);
        messages.push({
          severity: 'warning',
          text: `⏳ ${part.categoryLabel} "${part.name}" الان موجود نیست. ${sug.reason} به زودی موجود می‌کنیم.`,
        });
        actions.push({
          type: 'suggest',
          current: part,
          suggested: sug,
          reason: part.price === 0 ? 'price_unavailable' : 'out_of_stock',
          userMessage: `${part.categoryLabel} الان موجود نیست`,
          resolved: false,
        });
      }
    }
  }

  // ═══════ محاسبهٔ نتیجه ═══════
  const resolved = !hasRemainingIssues(workingParts, messages);

  return {
    parts: workingParts,
    actions,
    removedParts,
    suggestions,
    messages,
    resolved,
  };
}

// ════════════════════════════════════════════════════════════════
// 🔧 توابع حل هر قانون
// ════════════════════════════════════════════════════════════════

function resolveByKeepingCpu(
  cpu: AssemblyPart,
  mb: AssemblyPart,
  mbCandidates: AssemblyPart[],
  useCase: string
): {
  actions: ResolutionAction[];
  removedParts: any[];
  suggestions: SuggestedPart[];
  messages: any[];
  newPart?: AssemblyPart;
} {
  const actions: ResolutionAction[] = [];
  const removedParts: any[] = [];
  const suggestions: SuggestedPart[] = [];
  const messages: any[] = [];
  let newPart: AssemblyPart | undefined;

  const cpuSocket = cpu.specs?.socket;

  // جستجوی مادربرد سازگار (همون سوکت)
  const compatibleMb = mbCandidates.find(
    (c) => c.specs?.socket === cpuSocket && c.inStock && c.price > 0 && c.id !== mb.id
  );

  if (compatibleMb) {
    // موفق: جایگزین شد
    actions.push({
      type: 'replace',
      current: mb,
      suggested: compatibleMb,
      reason: `socket_mismatch_resolved`,
      userMessage: `مادربرد "${mb.name}" با CPU "${cpu.name}" ناسازگار بود (سوکت ${mb.specs?.socket} ≠ ${cpuSocket}). جایگزین شد با "${compatibleMb.name}" (سوکت ${cpuSocket}).`,
      resolved: true,
      removedPartId: mb.id,
      newPartId: compatibleMb.id,
    });
    messages.push({
      severity: 'success',
      text: `✅ مشکل سازگاری حل شد: مادربرد "${mb.name}" با "${compatibleMb.name}" (سوکت ${cpuSocket}) جایگزین شد.`,
    });
    newPart = compatibleMb;
  } else {
    // شکست: مادربرد حذف، پیشنهاد داده می‌شه
    removedParts.push({
      part: mb,
      reason: `مادربرد با سوکت ${mb.specs?.socket} با CPU "${cpu.name}" (سوکت ${cpuSocket}) سازگار نبود و جایگزین سازگار یافت نشد`,
    });
    actions.push({
      type: 'remove',
      current: mb,
      reason: 'no_compatible_mb',
      userMessage: `مادربرد "${mb.name}" (سوکت ${mb.specs?.socket}) با CPU "${cpu.name}" (سوکت ${cpuSocket}) سازگار نبود و جایگزین موجود نیست. مادربرد حذف شد.`,
      resolved: false,
      removedPartId: mb.id,
    });
    suggestions.push({
      name: `مادربرد با سوکت ${cpuSocket}`,
      model:
        cpuSocket === 'AM5'
          ? 'B650 / X670 (DDR5)'
          : cpuSocket === 'LGA1700'
            ? 'B760 / Z790'
            : cpuSocket === 'LGA1851'
              ? 'Z890 / B860'
              : cpuSocket,
      reason: `برای استفاده با CPU "${cpu.name}" به مادربردی با سوکت ${cpuSocket} نیاز داریم`,
      socket: cpuSocket,
      estimatedPrice:
        cpuSocket === 'AM5'
          ? '۱۵ تا ۳۰ میلیون'
          : cpuSocket === 'LGA1700'
            ? '۱۲ تا ۲۵ میلیون'
            : '۱۵ تا ۳۵ میلیون',
      availability: 'coming_soon',
    });
    messages.push({
      severity: 'warning',
      text: `⏳ مادربرد سازگار با CPU "${cpu.name}" الان نداریم، به زودی موجود می‌کنیم. پیشنهاد: مادربرد ${cpuSocket === 'AM5' ? 'B650 یا X670' : cpuSocket === 'LGA1700' ? 'B760 یا Z790' : 'Z890'}.`,
    });
  }

  return { actions, removedParts, suggestions, messages, newPart };
}

function resolveByKeepingMb(
  cpu: AssemblyPart,
  mb: AssemblyPart,
  cpuCandidates: AssemblyPart[],
  useCase: string
): {
  actions: ResolutionAction[];
  removedParts: any[];
  suggestions: SuggestedPart[];
  messages: any[];
  newPart?: AssemblyPart;
} {
  const actions: ResolutionAction[] = [];
  const removedParts: any[] = [];
  const suggestions: SuggestedPart[] = [];
  const messages: any[] = [];
  let newPart: AssemblyPart | undefined;

  const mbSocket = mb.specs?.socket;

  // جستجوی CPU سازگار (همون سوکت)
  const compatibleCpu = cpuCandidates.find(
    (c) => c.specs?.socket === mbSocket && c.inStock && c.price > 0 && c.id !== cpu.id
  );

  if (compatibleCpu) {
    actions.push({
      type: 'replace',
      current: cpu,
      suggested: compatibleCpu,
      reason: `socket_mismatch_resolved`,
      userMessage: `CPU "${cpu.name}" با مادربرد "${mb.name}" ناسازگار بود (سوکت ${cpu.specs?.socket} ≠ ${mbSocket}). جایگزین شد با "${compatibleCpu.name}" (سوکت ${mbSocket}).`,
      resolved: true,
      removedPartId: cpu.id,
      newPartId: compatibleCpu.id,
    });
    messages.push({
      severity: 'success',
      text: `✅ مشکل سازگاری حل شد: CPU "${cpu.name}" با "${compatibleCpu.name}" (سوکت ${mbSocket}) جایگزین شد.`,
    });
    newPart = compatibleCpu;
  } else {
    removedParts.push({
      part: cpu,
      reason: `CPU با سوکت ${cpu.specs?.socket} با مادربرد "${mb.name}" (سوکت ${mbSocket}) سازگار نبود و جایگزین موجود نیست`,
    });
    actions.push({
      type: 'remove',
      current: cpu,
      reason: 'no_compatible_cpu',
      userMessage: `CPU "${cpu.name}" (سوکت ${cpu.specs?.socket}) با مادربرد "${mb.name}" (سوکت ${mbSocket}) سازگار نبود و جایگزین موجود نیست. CPU حذف شد.`,
      resolved: false,
      removedPartId: cpu.id,
    });

    // پیشنهاد CPU سازگار
    const cpuSuggestion = suggestCpuForSocket(mbSocket);
    suggestions.push(cpuSuggestion);
    messages.push({
      severity: 'warning',
      text: `⏳ CPU سازگار با مادربرد "${mb.name}" الان نداریم، به زودی موجود می‌کنیم. پیشنهاد: ${cpuSuggestion.name} (${cpuSuggestion.model}).`,
    });
  }

  return { actions, removedParts, suggestions, messages, newPart };
}

function resolveRamMismatch(
  mb: AssemblyPart,
  ram: AssemblyPart,
  ramCandidates: AssemblyPart[]
): {
  actions: ResolutionAction[];
  removedParts: any[];
  suggestions: SuggestedPart[];
  messages: any[];
  newPart?: AssemblyPart;
} {
  const actions: ResolutionAction[] = [];
  const removedParts: any[] = [];
  const suggestions: SuggestedPart[] = [];
  const messages: any[] = [];
  let newPart: AssemblyPart | undefined;

  const mbRamType = mb.specs?.ramType;

  // جستجوی RAM سازگار
  const compatibleRam = ramCandidates.find(
    (c) => c.specs?.ramType === mbRamType && c.inStock && c.price > 0 && c.id !== ram.id
  );

  if (compatibleRam) {
    actions.push({
      type: 'replace',
      current: ram,
      suggested: compatibleRam,
      reason: 'ram_type_mismatch_resolved',
      userMessage: `رم "${ram.name}" (${ram.specs?.ramType}) با مادربرد "${mb.name}" (${mbRamType}) ناسازگار بود. جایگزین شد با "${compatibleRam.name}" (${mbRamType}).`,
      resolved: true,
      removedPartId: ram.id,
      newPartId: compatibleRam.id,
    });
    messages.push({
      severity: 'success',
      text: `✅ رم با مادربرد سازگار شد: "${compatibleRam.name}" (${mbRamType}).`,
    });
    newPart = compatibleRam;
  } else {
    removedParts.push({
      part: ram,
      reason: `رم ${ram.specs?.ramType} با مادربرد ${mbRamType} سازگار نبود و جایگزین موجود نیست`,
    });
    actions.push({
      type: 'remove',
      current: ram,
      reason: 'no_compatible_ram',
      userMessage: `رم "${ram.name}" (${ram.specs?.ramType}) با مادربرد "${mb.name}" (${mbRamType}) ناسازگار بود. رم حذف شد.`,
      resolved: false,
      removedPartId: ram.id,
    });
    suggestions.push({
      name: `رم ${mbRamType}`,
      model:
        mbRamType === 'DDR5'
          ? 'Kingston Fury Beast DDR5 32GB 5600MHz'
          : 'Kingston Fury Beast DDR4 32GB 3200MHz',
      reason: `برای مادربرد "${mb.name}" به رم ${mbRamType} نیاز داریم`,
      ramType: mbRamType,
      estimatedPrice: mbRamType === 'DDR5' ? '۱۵ تا ۳۰ میلیون' : '۸ تا ۱۵ میلیون',
      availability: 'coming_soon',
    });
    messages.push({
      severity: 'warning',
      text: `⏳ رم ${mbRamType} سازگار با مادربرد الان نداریم، به زودی موجود می‌کنیم. پیشنهاد: ${mbRamType === 'DDR5' ? 'Kingston Fury Beast DDR5' : 'Kingston Fury Beast DDR4'} 32GB.`,
    });
  }

  return { actions, removedParts, suggestions, messages, newPart };
}

function resolvePsuInsufficient(
  psu: AssemblyPart,
  cpu: AssemblyPart | undefined,
  gpu: AssemblyPart | undefined,
  psuCandidates: AssemblyPart[]
): {
  actions: ResolutionAction[];
  removedParts: any[];
  suggestions: SuggestedPart[];
  messages: any[];
  newPart?: AssemblyPart;
} {
  const actions: ResolutionAction[] = [];
  const removedParts: any[] = [];
  const suggestions: SuggestedPart[] = [];
  const messages: any[] = [];
  let newPart: AssemblyPart | undefined;

  const cpuTdp = (cpu?.specs?.tdp as number) || 95;
  const gpuTdp = (gpu?.specs?.tdp as number) || 150;
  const required = Math.round(((cpuTdp + gpuTdp + 100) * 1.25) / 50) * 50;
  const recommended = Math.round(((cpuTdp + gpuTdp + 100) * 1.4) / 50) * 50;

  // جستجوی PSU قوی‌تر
  const compatiblePsu = psuCandidates.find(
    (c) => (c.specs?.wattage || 0) >= recommended && c.inStock && c.price > 0 && c.id !== psu.id
  );

  if (compatiblePsu) {
    actions.push({
      type: 'replace',
      current: psu,
      suggested: compatiblePsu,
      reason: 'psu_insufficient_resolved',
      userMessage: `PSU "${psu.name}" (${psu.specs?.wattage}W) برای سیستم کافی نبود (حداقل ${required}W لازم). جایگزین شد با "${compatiblePsu.name}" (${compatiblePsu.specs?.wattage}W).`,
      resolved: true,
      removedPartId: psu.id,
      newPartId: compatiblePsu.id,
    });
    messages.push({
      severity: 'success',
      text: `✅ PSU ارتقاء یافت: "${compatiblePsu.name}" (${compatiblePsu.specs?.wattage}W) جایگزین شد.`,
    });
    newPart = compatiblePsu;
  } else {
    removedParts.push({
      part: psu,
      reason: `PSU ${psu.specs?.wattage}W برای سیستم کافی نبود (حداقل ${required}W) و جایگزین قوی‌تر موجود نیست`,
    });
    actions.push({
      type: 'remove',
      current: psu,
      reason: 'no_sufficient_psu',
      userMessage: `PSU "${psu.name}" (${psu.specs?.wattage}W) برای سیستم کافی نبود. حذف شد.`,
      resolved: false,
      removedPartId: psu.id,
    });
    suggestions.push({
      name: `PSU ${recommended}W 80+ Gold`,
      model:
        gpuTdp >= 450
          ? 'Corsair RM1000x / FSP Hydro PTM Pro'
          : 'Corsair RM850x / Seasonic Focus 850',
      reason: `برای سیستم با GPU ${gpuTdp}W + CPU ${cpuTdp}W، PSU حداقل ${required}W نیاز است (${recommended}W پیشنهاد می‌شود)`,
      estimatedPrice: gpuTdp >= 450 ? '۳۰ تا ۵۰ میلیون' : '۱۵ تا ۳۰ میلیون',
      availability: 'coming_soon',
    });
    messages.push({
      severity: 'warning',
      text: `⏳ PSU قوی (${recommended}W+) الان نداریم، به زودی موجود می‌کنیم.`,
    });
  }

  return { actions, removedParts, suggestions, messages, newPart };
}

function resolveCoolerInsufficient(
  cooler: AssemblyPart,
  cpu: AssemblyPart,
  coolerCandidates: AssemblyPart[]
): {
  actions: ResolutionAction[];
  removedParts: any[];
  suggestions: SuggestedPart[];
  messages: any[];
  newPart?: AssemblyPart;
} {
  const actions: ResolutionAction[] = [];
  const removedParts: any[] = [];
  const suggestions: SuggestedPart[] = [];
  const messages: any[] = [];
  let newPart: AssemblyPart | undefined;

  const required = Math.ceil((cpu.specs?.tdp || 95) * 1.3);

  const compatibleCooler = coolerCandidates.find(
    (c) => (c.specs?.tdpRating || 0) >= required && c.inStock && c.price > 0 && c.id !== cooler.id
  );

  if (compatibleCooler) {
    actions.push({
      type: 'replace',
      current: cooler,
      suggested: compatibleCooler,
      reason: 'cooler_insufficient_resolved',
      userMessage: `خنک‌کننده "${cooler.name}" (${cooler.specs?.tdpRating}W) برای CPU "${cpu.name}" (${cpu.specs?.tdp}W TDP) کافی نبود. جایگزین شد با "${compatibleCooler.name}" (${compatibleCooler.specs?.tdpRating}W).`,
      resolved: true,
      removedPartId: cooler.id,
      newPartId: compatibleCooler.id,
    });
    messages.push({
      severity: 'success',
      text: `✅ خنک‌کننده ارتقاء یافت: "${compatibleCooler.name}".`,
    });
    newPart = compatibleCooler;
  } else {
    removedParts.push({
      part: cooler,
      reason: `خنک‌کننده ${cooler.specs?.tdpRating}W برای CPU ${cpu.specs?.tdp}W کافی نبود`,
    });
    actions.push({
      type: 'remove',
      current: cooler,
      reason: 'no_sufficient_cooler',
      userMessage: `خنک‌کننده "${cooler.name}" کافی نبود. حذف شد (اختیاری).`,
      resolved: false,
      removedPartId: cooler.id,
    });
    suggestions.push({
      name:
        cpu.specs?.tdp && cpu.specs.tdp >= 150
          ? 'Noctua NH-D15 / Deepcool AK620'
          : 'Cooler Master Hyper 212',
      model:
        cpu.specs?.tdp && cpu.specs.tdp >= 150
          ? 'Noctua NH-D15 (250W)'
          : 'Cooler Master Hyper 212 (180W)',
      reason: `برای CPU "${cpu.name}" (${cpu.specs?.tdp}W TDP) خنک‌کننده با توان ${required}W+ نیاز است`,
      estimatedPrice: cpu.specs?.tdp && cpu.specs.tdp >= 150 ? '۱۰ تا ۲۰ میلیون' : '۳ تا ۸ میلیون',
      availability: 'coming_soon',
    });
  }

  return { actions, removedParts, suggestions, messages, newPart };
}

// ════════════════════════════════════════════════════════════════
// 💡 پیشنهاد قطعه برای سوکت خاص
// ════════════════════════════════════════════════════════════════

function suggestCpuForSocket(socket: string): SuggestedPart {
  const candidates = CPU_DB.filter((c) => c.socket === socket).sort((a, b) =>
    b.tier.localeCompare(a.tier)
  );
  const best = candidates[0];
  if (best) {
    return {
      name: `${best.brand} ${best.model}`,
      model: best.model,
      reason: `این CPU با سوکت ${socket} سازگار است و برای سیستم شما مناسب است`,
      socket,
      estimatedPrice:
        best.priceRange === 'premium'
          ? '۳۰ تا ۶۰ میلیون'
          : best.priceRange === 'high'
            ? '۲۰ تا ۴۰ میلیون'
            : best.priceRange === 'mid'
              ? '۱۰ تا ۲۵ میلیون'
              : '۵ تا ۱۵ میلیون',
      availability: 'coming_soon',
    };
  }
  return {
    name: `CPU با سوکت ${socket}`,
    model: 'مدل مناسب',
    reason: `به CPU با سوکت ${socket} نیاز داریم`,
    socket,
    availability: 'coming_soon',
  };
}

function suggestReplacementForUnavailable(part: AssemblyPart, useCase: string): SuggestedPart {
  const cat = part.category;

  // پیشنهاد بر اساس دسته
  const suggestions: Record<string, SuggestedPart> = {
    cpu: {
      name: part.specs?.brand === 'AMD' ? 'AMD Ryzen 7 7800X3D' : 'Intel Core i7-14700K',
      model: part.specs?.brand === 'AMD' ? 'Ryzen 7 7800X3D' : 'Core i7-14700K',
      reason: `پیشنهاد جایگزین: ${part.specs?.brand === 'AMD' ? 'Ryzen 7 7800X3D با ۸ هسته و ۱۶ رشته، عالی برای گیمینگ' : 'i7-14700K با ۲۰ هسته، عالی برای کارهای سنگین'}`,
      socket: part.specs?.socket,
      estimatedPrice: '۲۵ تا ۴۰ میلیون',
      availability: 'coming_soon',
    },
    gpu: {
      name: part.specs?.tier === 'ultra' ? 'RTX 4080 Super' : 'RTX 4070',
      model: part.specs?.tier === 'ultra' ? 'RTX 4080 Super 16GB' : 'RTX 4070 12GB',
      reason: `پیشنهاد جایگزین: ${part.specs?.tier === 'ultra' ? 'RTX 4080 Super با ۱۶GB VRAM' : 'RTX 4070 با ۱۲GB VRAM، عالی برای گیمینگ ۱۴۴۰p'}`,
      estimatedPrice: part.specs?.tier === 'ultra' ? '۵۰ تا ۸۰ میلیون' : '۳۵ تا ۵۰ میلیون',
      availability: 'coming_soon',
    },
    motherboard: {
      name:
        part.specs?.socket === 'AM5' ? 'ASRock B650M Pro-A WiFi DDR5' : 'MSI PRO B760M-A WiFi DDR5',
      model: part.specs?.socket === 'AM5' ? 'B650M Pro-A WiFi' : 'PRO B760M-A WiFi',
      reason: `پیشنهاد جایگزین: مادربرد ${part.specs?.socket === 'AM5' ? 'B650 سازگار با AM5 و DDR5' : 'B760 سازگار با LGA1700 و DDR5'}`,
      socket: part.specs?.socket,
      estimatedPrice: '۱۵ تا ۲۵ میلیون',
      availability: 'coming_soon',
    },
    ram: {
      name:
        part.specs?.ramType === 'DDR5'
          ? 'Kingston Fury Beast DDR5 32GB 5600MHz'
          : 'Kingston Fury Beast DDR4 32GB 3200MHz',
      model: part.specs?.ramType === 'DDR5' ? 'KF556C40BBK2-32' : 'KF432C16BBK2-32',
      reason: `پیشنهاد جایگزین: رم ${part.specs?.ramType || 'DDR5'} 32GB با کیفیت بالا`,
      ramType: part.specs?.ramType,
      estimatedPrice: part.specs?.ramType === 'DDR5' ? '۱۵ تا ۳۰ میلیون' : '۸ تا ۱۵ میلیون',
      availability: 'coming_soon',
    },
    psu: {
      name: 'Corsair RM850x Gold',
      model: 'CP-9020200-NA',
      reason: 'پیشنهاد جایگزین: PSU ماژولار ۸۵۰W Gold برای اکثر سیستم‌ها',
      estimatedPrice: '۱۵ تا ۲۵ میلیون',
      availability: 'coming_soon',
    },
    case: {
      name:
        part.specs?.formFactor === 'ATX'
          ? 'Lian Li Lancool II Mesh'
          : 'Cooler Master MasterBox Q300L',
      model: part.specs?.formFactor === 'ATX' ? 'Lancool II Mesh' : 'MasterBox Q300L',
      reason: `پیشنهاد جایگزین: کیس ${part.specs?.formFactor || 'ATX'} با جریان هوای خوب`,
      estimatedPrice: '۸ تا ۱۵ میلیون',
      availability: 'coming_soon',
    },
    storage: {
      name: 'Samsung 980 Pro 1TB NVMe Gen4',
      model: 'MZ-V8P1T0BW',
      reason: 'پیشنهاد جایگزین: SSD NVMe Gen4 با سرعت ۷۰۰۰MB/s',
      estimatedPrice: '۱۰ تا ۱۸ میلیون',
      availability: 'coming_soon',
    },
  };

  return (
    suggestions[cat] || {
      name: part.categoryLabel,
      model: part.name,
      reason: `پیشنهاد جایگزین برای ${part.categoryLabel} به زودی موجود می‌شود`,
      availability: 'coming_soon',
    }
  );
}

// ════════════════════════════════════════════════════════════════
// 🔍 بررسی مشکلات باقی‌مانده
// ════════════════════════════════════════════════════════════════

function hasRemainingIssues(parts: AssemblyPart[], messages: any[]): boolean {
  const errors = messages.filter((m) => m.severity === 'error').length;
  const warnings = messages.filter(
    (m) => m.severity === 'warning' && m.text.includes('ناسازگار')
  ).length;
  return errors > 0 || warnings > 0;
}
