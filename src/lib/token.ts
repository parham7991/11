// lib/token.ts
export async function getToken(): Promise<string | null> {
  try {
    const res = await fetch(`https://www.offl.ir/api/token`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
}
