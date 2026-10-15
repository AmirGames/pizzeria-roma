export async function readJson(request: Request, limit = 16384): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > limit) throw new Error('INVALID_REQUEST');
  try { return JSON.parse(raw); } catch { throw new Error('INVALID_REQUEST'); }
}
