import type { Budget, LedgerCategory } from '@/types/ledger';
import { mockBudgetRef, mockLedgersRef } from './_mockLedgersRef';

export interface UpdateBudgetInput {
  totalBudget?: number;
  categoryBudget?: Record<string, number>;
  stoneRate?: number; // 禁止传入（创建后不可改）
}

export default function updateBudget(data: UpdateBudgetInput): Promise<{ budget: Budget }> {
  // v1.1 确认：stoneRate 一经设定不可修改
  if (data.stoneRate !== undefined) {
    return Promise.reject(new Error('灵石人民币换算比例创建后不可修改')) as any;
  }

  if (data.totalBudget !== undefined) {
    mockBudgetRef.totalBudget = data.totalBudget;
  }
  if (data.categoryBudget) {
    mockBudgetRef.categoryBudget = data.categoryBudget as Record<LedgerCategory, number>;
  }
  mockBudgetRef.updateTime = new Date().toISOString();

  const budget: Budget = {
    coupleId: mockBudgetRef.coupleId,
    totalBudget: mockBudgetRef.totalBudget,
    stoneRate: mockBudgetRef.stoneRate,
    categoryBudget: mockBudgetRef.categoryBudget as Record<LedgerCategory, number>,
    updateTime: mockBudgetRef.updateTime
  };

  // 附加已花信息
  const spent = mockLedgersRef.reduce((s, l) => s + l.amount, 0);
  return Promise.resolve({
    budget,
    ...({ spent, remain: budget.totalBudget - spent } as any)
  } as any);
}
