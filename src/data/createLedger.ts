import type { LedgerItem as LedgerItemType, LedgerCategory, LedgerSourceType } from '@/types/ledger';
import { mockLedgersRef, mockBudgetRef } from './_mockLedgersRef';

export interface CreateLedgerInput {
  amount: number;
  category?: LedgerCategory; // 可不传，默认 'other'（v1.1 确认：允许"其他"兜底）
  note?: string;
  date?: string;
  sourceType?: LedgerSourceType; // 默认 'manual'
  taskId?: string;
  taskTitle?: string;
}

export default function createLedger(data: CreateLedgerInput): Promise<{
  ledger: LedgerItemType;
  budgetStatus: { spent: number; remain: number; isOverBudget: boolean; stoneRate: number; remainRmb: number };
}> {
  const ledger: LedgerItemType = {
    id: 'l' + Date.now(),
    coupleId: 'mock_couple_001',
    amount: data.amount || 0,
    category: data.category || 'other',
    note: data.note || '',
    date: data.date || new Date().toISOString().slice(0, 10),
    recorder: 'mock_openid_001',
    recorderName: '良人',
    recorderAvatar: 'https://picsum.photos/id/64/200/200',
    createTime: new Date().toISOString(),
    sourceType: data.sourceType || 'manual',
    taskId: data.taskId,
    taskTitle: data.taskTitle
  };

  // 写入共享 mock
  mockLedgersRef.unshift(ledger);

  const spent = mockLedgersRef.reduce((s, l) => s + l.amount, 0);
  const total = mockBudgetRef.totalBudget;
  const remain = total - spent;
  const stoneRate = mockBudgetRef.stoneRate;

  return Promise.resolve({
    ledger,
    budgetStatus: {
      spent,
      remain,
      isOverBudget: spent > total,
      stoneRate,
      remainRmb: remain * stoneRate
    }
  });
}
