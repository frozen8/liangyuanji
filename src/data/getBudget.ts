import type { Budget } from '@/types/ledger';
import { mockBudgetRef } from './_mockLedgersRef';
import { mockLedgersRef } from './_mockLedgersRef';

export default function getBudget(): Promise<{ budget: Budget }> {
  // 基于共享 mock 返回，并实时计算已花
  const spent = mockLedgersRef.reduce((s, l) => s + l.amount, 0);
  const budget: Budget = {
    coupleId: mockBudgetRef.coupleId,
    totalBudget: mockBudgetRef.totalBudget,
    stoneRate: mockBudgetRef.stoneRate,
    categoryBudget: mockBudgetRef.categoryBudget as any,
    updateTime: mockBudgetRef.updateTime
  };
  // 附加已花信息（类型扩展，前端可直接用）
  return Promise.resolve({
    budget,
    ...({ spent, remain: budget.totalBudget - spent } as any)
  } as any);
}
