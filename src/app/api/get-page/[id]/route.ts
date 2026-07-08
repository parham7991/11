import redis from '@/lib/redis';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id) {
    const cached = await redis.get(`${id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return Response.json({ source: 'cache', data: parsed });
      } catch (error) {
        console.error('Invalid JSON from cache:', cached);
        return Response.json({ message: 'invalid-cache-data', data: {} });
      }
    }

    return Response.json({ message: 'no-data', data: {} });
  } else {
    return Response.json({ message: 'no-id', data: '' });
  }
}
