import type { Task, TaskReward } from '@/types/task';

export interface CreateTaskInput {
  title: string;
  category: Task['category'];
  difficulty: number;
  deadline: string;
  budgetStones: number; // 必填：预算灵石
  note?: string;
}

export default function createTask(data: CreateTaskInput): Promise<{ task: Task }> {
  // 校验预算灵石
  if (!data.budgetStones || data.budgetStones <= 0) {
    return Promise.reject(new Error('请填写预算灵石')) as any;
  }

  const difficulty = data.difficulty || 1;
  // 创建时仅计算基础修为，节省奖励在完成时计算
  const baseCultivation = difficulty * 35;
  const reward: TaskReward = {
    cultivation: baseCultivation,
    moodBonus: 0,
    savedBonus: 0
  };

  const task: Task = {
    id: 't' + Date.now(),
    coupleId: 'mock_couple_001',
    title: data.title || '新任务',
    category: data.category || 'other',
    difficulty,
    deadline: data.deadline || '2026-12-31',
    status: 'pending',
    budgetStones: data.budgetStones,
    reward,
    note: data.note,
    createTime: new Date().toISOString()
  };
  return Promise.resolve({ task });
}
