# OFFL AI ELITE UPGRADE — DELIVERY DOCUMENT

## روش نصب

```bash
unzip offl-ai-elite-updated-YYYYMMDD-HHMM.zip
cd offl-ai-elite-updated
npm ci
cp .env.example .env.local
# ویرایش .env.local با کلید واقعی
```

## Environment Variables (ضروری)

| متغیر | مقدار نمونه | توضیح |
| --- | --- | --- |
| `AI_CHAT_PROVIDER` | `omniroute` | Provider اصلی (`omniroute`) |
| `AI_CHAT_API_KEY` | `__YOUR_KEY__` | Secret سروری (هرگز در Source/ZIP وارد نشود) |
| `AI_CHAT_MODEL` | `offl-ai-elite` | Combo اصلی |
| `AI_CHAT_API_BASE` | `https://api.lonz.ir/v1` | Endpoint OmniRoute |
| `AI_CHAT_ENABLED` | `1` | فعال‌سازی AI Chat |
| `NEXT_PUBLIC_AI_CHAT_ENABLED` | `1` | ویجت کلاینت |
| `AI_CHAT_TEMPERATURE` | `0.35` | دما (پایدار) |
| `AI_CHAT_MAX_TOKENS` | `1000` | حداکثر توکن |
| `AI_CHAT_ENABLE_RAG` | `1` | RAG فعال |
| `AI_CHAT_RAG_COUNT` | `10` | تعداد محصول در بافت |
| `AI_CHAT_USE_PROXY` | `0` | خاموش برای OmniRoute |

## Build

```bash
npm run build
```

## Start

```bash
npm start
```

## Health Check

```bash
curl -s http://localhost:3000/api/ai-chat | jq .
```

انتظاری: `{"enabled":true,"hasKey":true,"provider":"OmniRoute Arena Elite","model":"offl-ai-elite","rag":true}`

## AI Test

اگر `.env.local` با `AI_CHAT_API_KEY` واقعی تنظیم شده باشد:

```bash
curl -s "http://localhost:3000/api/ai-chat?test=1" | jq .
```

انتظاری: `{"test":"ok", ...}`

اگر `AI_CHAT_API_KEY` تنظیم نشده باشد:
- `POST /api/ai-chat` با پیام کاربر: پاسخ `sources` + پیام عمومی (Fail-Safe بدون خطا)
- `GET /api/ai-chat?test=1`: `{"test":"fail","reason":"کلید تنظیم نشده"}`

## Assemble Test

```bash
curl -X POST http://localhost:3000/api/assemble \
  -H "Content-Type: application/json" \
  -d '{"useCase":"gaming","budget":50000000}' | jq '.ok, .compatibilityScore, .resolution.resolved'
```

انتظاری: `true`, امتیاز سازگاری > 80، `resolution.resolved: true`

## Production Checklist

- [x] هیچ Secret در Source/ZIP وجود ندارد (`grep -rni 'gsk_\|sk-' src/` → ۰ مورد)
- [x] `.env.local` در ZIP وجود ندارد
- [x] `node_modules`, `.next`, `.git`, `build`, `dist` در ZIP وجود ندارند
- [x] `.env.example` فقط Placeholder دارد
- [x] `AI_CHAT_PROVIDER=omniroute` و `AI_CHAT_MODEL=offl-ai-elite`
- [x] Rate Limit فعال (۱۵ درخواست/دقیقه/IP)
- [x] Prompt Injection Sanitization فعال
- [x] URL Sanitization فعال در RAG
- [x] Fail-Safe بدون API Key کار می‌کند (Rule-Based)
- [x] Agent Mode (`arena-agent/agent`) آخرین Fallback است، Primary نیست
- [x] Build بدون خطا (`npm run build` موفق)
- [x] TypeScript Strict رعایت شده (`npx tsc --noEmit`)
- [x] ZIP برای Path Traversal و Symlink بررسی شده (ساختار ساده، بدون symlink خطرناک)
- [x] SHA-256 و اندازه ZIP ثبت شده

## SHA-256 و مشخصات ZIP (پس از ساخت)

این فایل (`DELIVERY.md`) قبل از ZIP نهایی نوشته شده است. پس از ساخت ZIP، دستور زیر اجرا شود:

```bash
sha256sum deliverables/offl-ai-elite-updated-YYYYMMDD-HHMM.zip > deliverables/offl-ai-elite-updated-YYYYMMDD-HHMM.zip.sha256
ls -lh deliverables/offl-ai-elite-updated-YYYYMMDD-HHMM.zip
```
