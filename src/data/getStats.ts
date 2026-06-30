import type { Task } from '@/types/task';
import type { CultivateTodayStats } from '@/types/cultivate';
import { mockBudgetRef, mockLedgersRef } from './_mockLedgersRef';

interface StatsSummary {
  todayTasks: Task[];
  todayCultivate: CultivateTodayStats;
  todaySpirit: { spent: number; saved: number }; // 今日灵石消耗（spent=今日支出，saved=今日节省）
  coupleMembers: Array<{ openid: string; nickname: string; avatar: string; isSelf: boolean }>;
  weddingDate: string;
  spirit: number; // 灵石池余额
  budgetStatus: {
    total: number;
    spent: number;
    remain: number;
    spentPercent: number;
    isOverBudget: boolean;
    stoneRate: number;
    remainRmb: number;
    spentRmb: number;
  };
}

export default function getStats(data?: { type?: string }): Promise<{ summary: StatsSummary }> {
  const today = new Date().toISOString().slice(0, 10);
  const todayLedgers = mockLedgersRef.filter((l) => l.date === today);
  const todaySpent = todayLedgers.reduce((s, l) => s + l.amount, 0);

  const totalSpent = mockLedgersRef.reduce((s, l) => s + l.amount, 0);
  const totalBudget = mockBudgetRef.totalBudget;
  const stoneRate = mockBudgetRef.stoneRate;
  const remain = totalBudget - totalSpent;

  const summary: StatsSummary = {
    todayTasks: [
      {
        id: 't1',
        coupleId: 'mock_couple_001',
        title: '试穿婚纱',
        category: 'dress',
        difficulty: 3,
        deadline: '2026-06-29',
        status: 'pending',
        assigneeName: '良人',
        budgetStones: 8888,
        reward: { cultivation: 105, moodBonus: 0, savedBonus: 0 },
        createTime: '2026-06-20 10:00:00'
      },
      {
        id: 't2',
        coupleId: 'mock_couple_001',
        title: '确定酒店场地',
        category: 'hotel',
        difficulty: 4,
        deadline: '2026-07-05',
        status: 'doing',
        assigneeName: '佳人',
        budgetStones: 25000,
        reward: { cultivation: 140, moodBonus: 0, savedBonus: 0 },
        createTime: '2026-06-22 14:00:00'
      },
      {
        id: 't3',
        coupleId: 'mock_couple_001',
        title: '拟定宾客名单',
        category: 'invitation',
        difficulty: 2,
        deadline: '2026-07-10',
        status: 'pending',
        budgetStones: 500,
        reward: { cultivation: 70, moodBonus: 0, savedBonus: 0 },
        createTime: '2026-06-25 09:00:00'
      }
    ],
    todayCultivate: {
      completedCount: 3,
      totalMinutes: 75,
      totalCultivation: 750
    },
    todaySpirit: { spent: todaySpent || 580, saved: 120 },
    coupleMembers: [
      { openid: 'mock_openid_001', nickname: '良人', avatar: 'https://picsum.photos/id/64/200/200', isSelf: true },
      { openid: 'mock_openid_002', nickname: '佳人', avatar: 'https://picsum.photos/id/91/200/200', isSelf: false }
    ],
    weddingDate: '2026-10-01',
    spirit: remain,
    budgetStatus: {
      total: totalBudget,
      spent: totalSpent,
      remain,
      spentPercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      isOverBudget: totalSpent > totalBudget,
      stoneRate,
      remainRmb: remain * stoneRate,
      spentRmb: totalSpent * stoneRate
    }
  };
  return Promise.resolve({ summary });
}
