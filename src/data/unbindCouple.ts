export default function unbindCouple(data: { coupleId: string }): Promise<{ ok: true }> {
  console.log('[Mock] unbindCouple:', data.coupleId);
  return Promise.resolve({ ok: true });
}
