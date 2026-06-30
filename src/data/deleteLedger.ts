import { mockLedgersRef } from './_mockLedgersRef';

export interface DeleteLedgerInput {
  ledgerId: string;
}

export default function deleteLedger(data: DeleteLedgerInput): Promise<{ ok: true }> {
  const ledger = mockLedgersRef.find((l) => l.id === data.ledgerId);
  // v1.1 确认：sourceType='task' 的账单禁止删除（需通过删除任务回退，但任务已完成时也无法删，等同于账单永久保留）
  if (ledger && ledger.sourceType === 'task') {
    return Promise.reject(new Error('降妖任务账单不可删除，请通过任务管理')) as any;
  }
  const idx = mockLedgersRef.findIndex((l) => l.id === data.ledgerId);
  if (idx >= 0) {
    mockLedgersRef.splice(idx, 1);
  }
  console.log('[Mock] deleteLedger:', data.ledgerId);
  return Promise.resolve({ ok: true });
}
