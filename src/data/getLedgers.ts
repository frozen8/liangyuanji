import type { LedgerItem as LedgerItemType, CategoryStat, LedgerCategory } from '@/types/ledger';
import { mockLedgersRef, mockBudgetRef } from './_mockLedgersRef';

export interface GetLedgersResult {
  ledgers: LedgerItemType[];
  stats: {
    totalSpent: number;
    categoryStats: CategoryStat[];
    recorderStats: Array<{ openid: string; name: string; avatar: string; amount: number }>;
    sourceStats: { taskAmount: number; manualAmount: number; taskCount: number; manualCount: number };
  };
}

export default function getLedgers(data?: { month?: string; category?: string; sourceType?: string }): Promise<GetLedgersResult> {
  let ledgers = mockLedgersRef;
  if (data?.category && data.category !== 'all') {
    ledgers = ledgers.filter((l) => l.category === data.category);
  }
  if (data?.sourceType && data.sourceType !== 'all') {
    ledgers = ledgers.filter((l) => l.sourceType === data.sourceType);
  }

  const totalSpent = ledgers.reduce((sum, l) => sum + l.amount, 0);

  // 分类统计
  const categoryMap: Record<string, number> = {};
  ledgers.forEach((l) => {
    categoryMap[l.category] = (categoryMap[l.category] || 0) + l.amount;
  });
  const categoryStats: CategoryStat[] = Object.entries(categoryMap).map(([category, amount]) => ({
    category: category as LedgerCategory,
    amount,
    percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  // 记账人统计
  const recorderMap: Record<string, { name: string; avatar: string; amount: number }> = {};
  ledgers.forEach((l) => {
    if (!recorderMap[l.recorder]) {
      recorderMap[l.recorder] = { name: l.recorderName, avatar: l.recorderAvatar, amount: 0 };
    }
    recorderMap[l.recorder].amount += l.amount;
  });
  const recorderStats = Object.entries(recorderMap).map(([openid, v]) => ({ openid, ...v }));

  // 来源统计（降妖 vs 独立）
  const taskLedgers = ledgers.filter((l) => l.sourceType === 'task');
  const manualLedgers = ledgers.filter((l) => l.sourceType === 'manual');
  const sourceStats = {
    taskAmount: taskLedgers.reduce((s, l) => s + l.amount, 0),
    manualAmount: manualLedgers.reduce((s, l) => s + l.amount, 0),
    taskCount: taskLedgers.length,
    manualCount: manualLedgers.length
  };

  return Promise.resolve({ ledgers, stats: { totalSpent, categoryStats, recorderStats, sourceStats } });
}

// 导出 budget 供其他模块复用
export { mockBudgetRef };
