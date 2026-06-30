import { mockBudgetRef } from './_mockLedgersRef';

export interface CreateCoupleInput {
  weddingDate: string;
  nickname: string;
  totalBudget: number; // 婚礼总预算（灵石池）
  stoneRate: number; // 灵石与人民币换算比例（创建后不可修改）
}

export default function createCouple(data: CreateCoupleInput): Promise<{
  coupleId: string;
  inviteCode: string;
  beast: { id: string; name: string; stage: string };
  budget: { totalBudget: number; stoneRate: number };
}> {
  // 初始化灵石池（写入共享 mock budget）
  mockBudgetRef.coupleId = 'mock_couple_new';
  mockBudgetRef.totalBudget = data.totalBudget;
  mockBudgetRef.stoneRate = data.stoneRate;
  mockBudgetRef.updateTime = new Date().toISOString();

  return Promise.resolve({
    coupleId: 'mock_couple_new',
    inviteCode: 'LY' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    beast: { id: 'mock_beast_new', name: '缘缘', stage: 'egg' },
    budget: { totalBudget: data.totalBudget, stoneRate: data.stoneRate }
  });
}
