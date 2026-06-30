import type { Task, TaskReward } from '@/types/task';
import type { LedgerItem, LedgerCategory, BudgetStatus } from '@/types/ledger';
import { TASK_TO_LEDGER_CATEGORY } from '@/types/ledger';

export interface UpdateTaskInput {
  taskId: string;
  status?: string; // 'doing' | 'done' | 'overdue'
  actualStones?: number; // 完成时必填：实际花费灵石
  budgetStones?: number; // 禁止传入（创建后不可改）
}

export interface UpdateTaskResult {
  task: Task;
  reward: TaskReward;
  ledger?: LedgerItem; // 完成时自动生成的账单
  budgetStatus?: BudgetStatus; // 完成时返回最新预算状态
}

// mock 任务存储（与 getTasks 共享同一份 mock 数据，简化处理）
import { mockTasksRef } from './_mockTasksRef';

export default function updateTask(data: UpdateTaskInput): Promise<UpdateTaskResult> {
  // 拒绝修改 budgetStones（v1.1 确认：预算完全不可改）
  if (data.budgetStones !== undefined) {
    return Promise.reject(new Error('预算灵石创建后不可修改')) as any;
  }

  const task = mockTasksRef.find((t) => t.id === data.taskId);
  if (!task) {
    return Promise.reject(new Error('任务不存在')) as any;
  }

  // 状态更新
  if (data.status) {
    task.status = data.status as Task['status'];
  }

  // 完成任务：必须填写实际花费
  if (data.status === 'done') {
    if (data.actualStones === undefined || data.actualStones < 0) {
      return Promise.reject(new Error('请填写实际花费灵石')) as any;
    }

    const actualStones = data.actualStones;
    const budgetStones = task.budgetStones;
    const savedStones = budgetStones - actualStones; // 正=节省，负=超支

    // 计算基础修为
    const baseCultivation = task.difficulty * 35;
    // 计算节省奖励修为：每节省100灵石=10修为
    const savedBonus = savedStones > 0 ? Math.floor(savedStones / 100) * 10 : 0;
    // 计算心情变化
    let moodBonus = 0;
    if (savedStones > 0) {
      // 节省：心情 += min(节省金额/200 × 3, 15)
      moodBonus = Math.min(Math.floor((savedStones / 200) * 3), 15);
    } else if (savedStones < 0) {
      // 超支：心情 -= min(超支金额/200 × 5, 20)
      moodBonus = -Math.min(Math.floor((-savedStones / 200) * 5), 20);
    }

    const reward: TaskReward = {
      cultivation: baseCultivation + savedBonus,
      moodBonus,
      savedBonus
    };

    task.actualStones = actualStones;
    task.savedStones = savedStones;
    task.reward = reward;
    task.completeTime = new Date().toISOString();

    // 自动生成账单
    const ledgerCategory: LedgerCategory = TASK_TO_LEDGER_CATEGORY[task.category];
    const ledger: LedgerItem = {
      id: 'l' + Date.now(),
      coupleId: task.coupleId,
      amount: actualStones,
      category: ledgerCategory,
      note: `降妖·${task.title}`,
      date: new Date().toISOString().slice(0, 10),
      recorder: 'mock_openid_001',
      recorderName: '良人',
      recorderAvatar: 'https://picsum.photos/id/64/200/200',
      createTime: new Date().toISOString(),
      sourceType: 'task',
      taskId: task.id,
      taskTitle: task.title
    };

    // mock 预算状态
    const budgetStatus: BudgetStatus = {
      total: 80000,
      spent: 40000 + actualStones,
      remain: 80000 - 40000 - actualStones,
      spentPercent: Math.round(((40000 + actualStones) / 80000) * 100),
      isOverBudget: 40000 + actualStones > 80000,
      stoneRate: 1,
      remainRmb: 80000 - 40000 - actualStones,
      spentRmb: 40000 + actualStones
    };

    return Promise.resolve({ task, reward, ledger, budgetStatus });
  }

  // 非完成态：仅返回任务与默认 reward
  return Promise.resolve({
    task,
    reward: task.reward
  });
}
