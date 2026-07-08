import { useSession } from '@/lib/auth/useSession';
import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * useAddBulkCart — افزودن چند محصول (یک سیستم اسمبل‌شده) به سبد خرید.
 * هر محصول را به‌صورت ترتیبی به بک‌اند POST می‌کند تا همگی در سبد قرار گیرند،
 * سپس کش سبد را تازه می‌کند و یک پیام نتیجه نشان می‌دهد.
 */
export const useAddBulkCart = () => {
  const queryClient = useQueryClient();
  const session = useSession(false);

  return useMutation({
    mutationFn: async (items: Array<{ id: number | string; qty?: number }>) => {
      const results: Array<{ id: number | string; ok: boolean; message?: string }> = [];
      for (const item of items) {
        try {
          const res = await request({
            url: `/cart?qty=${Number(item.qty || 1)}&product_id=${item.id}&code=${session?.finger ?? ''}`,
            method: 'POST',
          });
          const ok = res?.result !== 'error';
          results.push({ id: item.id, ok, message: res?.message });
        } catch (e) {
          results.push({
            id: item.id,
            ok: false,
            message: e instanceof Error ? e.message : 'failed',
          });
        }
      }
      return results;
    },
    onSuccess: async (results) => {
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      await queryClient.invalidateQueries({ queryKey: ['carts'] });
      if (ok > 0 && fail === 0) {
        addToast({ title: `همهٔ ${ok.toLocaleString('fa-IR')} قطعه به سبد خرید اضافه شد ✅`, color: 'success' });
      } else if (ok > 0) {
        addToast({
          title: `${ok.toLocaleString('fa-IR')} قطعه اضافه شد، ${fail.toLocaleString('fa-IR')} مورد ناموفق بود`,
          color: 'warning',
        });
      } else {
        addToast({ title: 'افزودن به سبد ناموفق بود. دوباره تلاش کنید.', color: 'danger' });
      }
    },
    onError: (error) => {
      addToast({ title: error.message || 'خطا در افزودن به سبد', color: 'danger' });
    },
  });
};
