/**
 * ════════════════════════════════════════════════════════════════
 * 🎯 benchmark-library.ts — کتابخانه بنچمارک ۲۰+ عنوان
 * ════════════════════════════════════════════════════════════════
 *
 * مجموعه‌ای از عناوین محبوب گیمینگ، رندرینگ و AI که کاربر می‌تواند
 * از میان آن‌ها انتخاب کند و برای هر عنوان تخمین زنده‌ی FPS یا
 * امتیاز کارایی مشاهده کند.
 *
 * هر عنوان دارای آستانه‌های نسبی CPU/GPU (0-100) و ضریب حساسیت
 * است تا فرمول عمومی بتواند در برابر آستانه‌ها امتیاز/FPS بدهد.
 * ════════════════════════════════════════════════════════════════
 */

import { cpuPerformanceScore, gpuPerformanceScore, type TelemetryPart } from './telemetry';

export type BenchmarkCategory =
  | 'GAME_AAA'
  | 'GAME_ESPORTS'
  | 'RENDER_VIDEO'
  | 'RENDER_3D'
  | 'AI_CODING';

export interface BenchmarkItem {
  id: string;
  title: string;
  category: BenchmarkCategory;
  /** آستانهٔ نسبی GPU مورد نیاز (0-100) */
  baseGpuScoreThreshold: number;
  /** آستانهٔ نسبی CPU مورد نیاز (0-100) */
  baseCpuScoreThreshold: number;
  /** وزن GPU در امتیاز نهایی (0-1) */
  gpuWeight: number;
  /** وزن CPU در امتیاز نهایی (0-1) */
  cpuWeight: number;
  /** ضریب تبدیل امتیاز نرمال به FPS (برای بازی‌ها) — 0 یعنی خروجی امتیاز است نه FPS */
  fpsMultiplier: number;
  /** واحد نمایش */
  unit: string;
  /** خلاصه یک‌خطی به فارسی */
  descriptionFa: string;
}

export const COMPLETE_BENCHMARK_LIBRARY: BenchmarkItem[] = [
  // ═════ AAA Games ═════
  {
    id: 'gta_vi_ready',
    title: 'GTA VI (تخمین Ready)',
    category: 'GAME_AAA',
    baseGpuScoreThreshold: 85, baseCpuScoreThreshold: 80,
    gpuWeight: 0.65, cpuWeight: 0.35,
    fpsMultiplier: 0.85, unit: 'FPS @ 1440p',
    descriptionFa: 'تخمین اجرا در نسخهٔ آیندهٔ GTA بر اساس ترند نسل جدید.',
  },
  {
    id: 'cyberpunk_rt_ultra',
    title: 'Cyberpunk 2077 — Ray Tracing Ultra',
    category: 'GAME_AAA',
    baseGpuScoreThreshold: 90, baseCpuScoreThreshold: 75,
    gpuWeight: 0.8, cpuWeight: 0.2,
    fpsMultiplier: 0.9, unit: 'FPS @ 1440p',
    descriptionFa: 'سنگین‌ترین بازی از نظر GPU و Ray Tracing.',
  },
  {
    id: 'alan_wake_2',
    title: 'Alan Wake 2 — Path Tracing',
    category: 'GAME_AAA',
    baseGpuScoreThreshold: 88, baseCpuScoreThreshold: 70,
    gpuWeight: 0.8, cpuWeight: 0.2,
    fpsMultiplier: 0.75, unit: 'FPS @ 1440p',
    descriptionFa: 'Path Tracing سنگین‌ترین بار گرافیکی مدرن.',
  },
  {
    id: 'black_myth_wukong',
    title: 'Black Myth: Wukong — Cinematic',
    category: 'GAME_AAA',
    baseGpuScoreThreshold: 85, baseCpuScoreThreshold: 75,
    gpuWeight: 0.7, cpuWeight: 0.3,
    fpsMultiplier: 0.95, unit: 'FPS @ 1440p',
    descriptionFa: 'بازی هندی-چینی سنگین با UE5.',
  },
  {
    id: 'forza_horizon_5',
    title: 'Forza Horizon 5 — Extreme',
    category: 'GAME_AAA',
    baseGpuScoreThreshold: 70, baseCpuScoreThreshold: 65,
    gpuWeight: 0.6, cpuWeight: 0.4,
    fpsMultiplier: 1.5, unit: 'FPS @ 1440p',
    descriptionFa: 'ماشین‌سواری بهینه با فریم بالا.',
  },
  {
    id: 'red_dead_2',
    title: 'Red Dead Redemption 2 — Ultra',
    category: 'GAME_AAA',
    baseGpuScoreThreshold: 78, baseCpuScoreThreshold: 70,
    gpuWeight: 0.7, cpuWeight: 0.3,
    fpsMultiplier: 1.1, unit: 'FPS @ 1440p',
    descriptionFa: 'شاهکار Rockstar با جهان باز.',
  },
  {
    id: 'hogwarts_legacy',
    title: 'Hogwarts Legacy — RT High',
    category: 'GAME_AAA',
    baseGpuScoreThreshold: 82, baseCpuScoreThreshold: 72,
    gpuWeight: 0.72, cpuWeight: 0.28,
    fpsMultiplier: 1.0, unit: 'FPS @ 1440p',
    descriptionFa: 'جادوگری با Ray Tracing نرم.',
  },

  // ═════ Esports ═════
  {
    id: 'valorant_360',
    title: 'Valorant — Pro 360Hz',
    category: 'GAME_ESPORTS',
    baseGpuScoreThreshold: 50, baseCpuScoreThreshold: 85,
    gpuWeight: 0.3, cpuWeight: 0.7,
    fpsMultiplier: 3.8, unit: 'FPS @ 1080p',
    descriptionFa: 'رقابتی — کاملاً وابسته به CPU.',
  },
  {
    id: 'cs2_pro',
    title: 'Counter-Strike 2 — Competitive',
    category: 'GAME_ESPORTS',
    baseGpuScoreThreshold: 60, baseCpuScoreThreshold: 88,
    gpuWeight: 0.35, cpuWeight: 0.65,
    fpsMultiplier: 3.5, unit: 'FPS @ 1080p',
    descriptionFa: 'رقابتی حرفه‌ای با اولویت CPU.',
  },
  {
    id: 'warzone_urzikstan',
    title: 'Call of Duty: Warzone',
    category: 'GAME_ESPORTS',
    baseGpuScoreThreshold: 75, baseCpuScoreThreshold: 80,
    gpuWeight: 0.55, cpuWeight: 0.45,
    fpsMultiplier: 1.9, unit: 'FPS @ 1080p',
    descriptionFa: 'بتل‌رویال متوازن.',
  },
  {
    id: 'apex_legends',
    title: 'Apex Legends — 240Hz Target',
    category: 'GAME_ESPORTS',
    baseGpuScoreThreshold: 65, baseCpuScoreThreshold: 75,
    gpuWeight: 0.5, cpuWeight: 0.5,
    fpsMultiplier: 2.4, unit: 'FPS @ 1080p',
    descriptionFa: 'بتل‌رویال با نیاز به CPU سریع.',
  },
  {
    id: 'fortnite_perf',
    title: 'Fortnite — Performance Mode',
    category: 'GAME_ESPORTS',
    baseGpuScoreThreshold: 45, baseCpuScoreThreshold: 70,
    gpuWeight: 0.4, cpuWeight: 0.6,
    fpsMultiplier: 3.0, unit: 'FPS @ 1080p',
    descriptionFa: 'کاملاً بهینه در حالت Performance.',
  },

  // ═════ Video Rendering ═════
  {
    id: 'premiere_4k_export',
    title: 'Adobe Premiere Pro — 4K H.265 Export',
    category: 'RENDER_VIDEO',
    baseGpuScoreThreshold: 80, baseCpuScoreThreshold: 85,
    gpuWeight: 0.45, cpuWeight: 0.55,
    fpsMultiplier: 0, unit: 'امتیاز سرعت (۰-۱۰)',
    descriptionFa: 'خروجی نهایی ویدیوی ۴K.',
  },
  {
    id: 'davinci_resolve_studio',
    title: 'DaVinci Resolve Studio — 4K RAW',
    category: 'RENDER_VIDEO',
    baseGpuScoreThreshold: 88, baseCpuScoreThreshold: 80,
    gpuWeight: 0.6, cpuWeight: 0.4,
    fpsMultiplier: 0, unit: 'امتیاز رندر (۰-۱۰)',
    descriptionFa: 'گریدینگ حرفه‌ای با اولویت GPU.',
  },
  {
    id: 'after_effects_vfx',
    title: 'Adobe After Effects — VFX',
    category: 'RENDER_VIDEO',
    baseGpuScoreThreshold: 70, baseCpuScoreThreshold: 90,
    gpuWeight: 0.35, cpuWeight: 0.65,
    fpsMultiplier: 0, unit: 'روانی پیش‌نمایش (۰-۱۰)',
    descriptionFa: 'CPU-bound برای VFX پیچیده.',
  },

  // ═════ 3D Rendering ═════
  {
    id: 'blender_cycles_rtx',
    title: 'Blender Cycles OptiX',
    category: 'RENDER_3D',
    baseGpuScoreThreshold: 92, baseCpuScoreThreshold: 70,
    gpuWeight: 0.85, cpuWeight: 0.15,
    fpsMultiplier: 0, unit: 'امتیاز رندر (۰-۱۰)',
    descriptionFa: 'رندر ۳D با OptiX — کاملاً GPU-bound.',
  },
  {
    id: 'unreal_engine_5_lumen',
    title: 'Unreal Engine 5 — Lumen & Nanite',
    category: 'RENDER_3D',
    baseGpuScoreThreshold: 90, baseCpuScoreThreshold: 88,
    gpuWeight: 0.55, cpuWeight: 0.45,
    fpsMultiplier: 0, unit: 'امتیاز توسعه (۰-۱۰)',
    descriptionFa: 'موتور بازی نسل جدید متوازن.',
  },
  {
    id: '3ds_max_vray',
    title: '3ds Max + V-Ray 6',
    category: 'RENDER_3D',
    baseGpuScoreThreshold: 85, baseCpuScoreThreshold: 85,
    gpuWeight: 0.55, cpuWeight: 0.45,
    fpsMultiplier: 0, unit: 'امتیاز پردازش (۰-۱۰)',
    descriptionFa: 'رندر معماری با V-Ray.',
  },

  // ═════ AI / Coding ═════
  {
    id: 'python_pytorch_ai',
    title: 'PyTorch — LLM Fine-Tuning',
    category: 'AI_CODING',
    baseGpuScoreThreshold: 95, baseCpuScoreThreshold: 75,
    gpuWeight: 0.9, cpuWeight: 0.1,
    fpsMultiplier: 0, unit: 'امتیاز سرعت آموزش (۰-۱۰)',
    descriptionFa: 'AI Fine-Tuning — کاملاً وابسته به VRAM.',
  },
  {
    id: 'stable_diffusion_xl',
    title: 'Stable Diffusion XL — Image Gen',
    category: 'AI_CODING',
    baseGpuScoreThreshold: 90, baseCpuScoreThreshold: 60,
    gpuWeight: 0.9, cpuWeight: 0.1,
    fpsMultiplier: 0, unit: 'امتیاز سرعت تولید (۰-۱۰)',
    descriptionFa: 'تولید تصویر AI — GPU + VRAM.',
  },
  {
    id: 'docker_k8s_dev',
    title: 'Docker + Kubernetes Dev',
    category: 'AI_CODING',
    baseGpuScoreThreshold: 30, baseCpuScoreThreshold: 92,
    gpuWeight: 0.1, cpuWeight: 0.9,
    fpsMultiplier: 0, unit: 'امتیاز چندوظیفگی (۰-۱۰)',
    descriptionFa: 'مالتی‌کانتینر — نیازمند CPU سنگین + RAM.',
  },
];

/**
 * تخمین امتیاز/FPS برای یک بنچمارک بر اساس CPU و GPU انتخابی.
 * منطق: امتیاز نرمال [0..1] با وزن‌گذاری بین آستانه‌ها.
 */
export function estimateBenchmark(
  item: BenchmarkItem,
  parts: TelemetryPart[]
): { score: number; formatted: string; readiness: 'excellent' | 'good' | 'fair' | 'insufficient' } {
  const cpu = parts.find(p => p.category === 'cpu');
  const gpu = parts.find(p => p.category === 'gpu');
  const cScore = cpuPerformanceScore(cpu);
  const gScore = gpuPerformanceScore(gpu);

  // نسبت رسیدن به آستانه (می‌تواند از 1 هم بیشتر شود)
  const cRatio = cScore / Math.max(1, item.baseCpuScoreThreshold);
  const gRatio = gScore / Math.max(1, item.baseGpuScoreThreshold);

  // وزن‌گذاری
  const rawScore = gRatio * item.gpuWeight + cRatio * item.cpuWeight;

  let score: number;
  let formatted: string;

  if (item.fpsMultiplier > 0) {
    // خروجی FPS
    const baseFps = 60; // مبنا: 60 FPS در آستانهٔ دقیق
    score = Math.max(10, Math.round(baseFps * rawScore * item.fpsMultiplier));
    formatted = `${score.toLocaleString('fa-IR')} FPS`;
  } else {
    // خروجی امتیاز 0-10
    score = Math.max(1, Math.min(10, Number((rawScore * 7).toFixed(1))));
    formatted = `${score.toLocaleString('fa-IR')} / 10`;
  }

  const readiness: 'excellent' | 'good' | 'fair' | 'insufficient' =
    rawScore >= 1.15 ? 'excellent' :
    rawScore >= 0.85 ? 'good' :
    rawScore >= 0.55 ? 'fair' : 'insufficient';

  return { score, formatted, readiness };
}

/** گروه‌بندی برای UI */
export function getBenchmarksByCategory(): Record<BenchmarkCategory, BenchmarkItem[]> {
  const groups: Record<BenchmarkCategory, BenchmarkItem[]> = {
    GAME_AAA: [],
    GAME_ESPORTS: [],
    RENDER_VIDEO: [],
    RENDER_3D: [],
    AI_CODING: [],
  };
  for (const b of COMPLETE_BENCHMARK_LIBRARY) groups[b.category].push(b);
  return groups;
}

export const BENCHMARK_CATEGORY_LABELS: Record<BenchmarkCategory, string> = {
  GAME_AAA: '🎮 بازی‌های AAA',
  GAME_ESPORTS: '⚔️ بازی‌های Esports',
  RENDER_VIDEO: '🎬 رندر ویدیو',
  RENDER_3D: '🧊 رندر ۳D',
  AI_CODING: '🧠 هوش مصنوعی و کدنویسی',
};
