import Redis from 'ioredis';

// فقط اگر host تعریف شده باشه، اتصال برقرار بشه
// در زمان build روی Vercel، Redis وجود نداره و نباید ارور بده
const redisHost = process.env.NEXT_PUBLIC_REDIS_HOST;

const redis = new Redis({
  host: redisHost || '127.0.0.1',
  port: Number(process.env.NEXT_PUBLIC_REDIS_PORT) || 6379,
  // password: 'در صورت نیاز'
  lazyConnect: true, // اتصال خودکار انجام نمیشه، فقط وقتی صدا زده بشه
  maxRetriesPerRequest: 3, // حداکثر ۳ بار تلاش
  retryStrategy(times) {
    if (times > 3) {
      // بعد از ۳ بار تلاش، دیگه تلاش نکن
      return null;
    }
    return Math.min(times * 200, 1000);
  },
  enableOfflineQueue: false, // وقتی آفلاین هست، درخواست‌ها reject بشن بجای صف شدن
});

// هندل کردن ارور اتصال برای جلوگیری از crash در build time
redis.on('error', (err) => {
  // فقط لاگ بگیر، crash نکن
  if (process.env.NODE_ENV === 'development') {
    console.warn('[ioredis] Connection error:', err.message);
  }
});

export default redis;
