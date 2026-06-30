// 降妖录（任务）类型

export type TaskCategory = 'dress' | 'hotel' | 'banquet' | 'invitation' | 'gift' | 'shopping' | 'other';

export type TaskStatus = 'pending' | 'doing' | 'done' | 'overdue';

export interface TaskReward {
  cultivation: number; // 基础修为（难度×35）
  moodBonus: number; // 心情加成（节省为正、超支为负，完成时计算）
  savedBonus: number; // 节省奖励修为（预算-实际>0 时为正）
}

export interface Task {
  id: string;
  coupleId: string;
  title: string;
  category: TaskCategory;
  difficulty: number; // 1-5 星
  deadline: string; // 截止日期 YYYY-MM-DD
  status: TaskStatus;
  assignee?: string; // 发布者 openid
  assigneeName?: string; // 发布者昵称
  completer?: string; // 降服者 openid
  completerName?: string; // 降服者昵称
  collaborator?: string; // 协作人
  budgetStones: number; // 预算灵石（创建时填写，创建后不可改）
  actualStones?: number; // 实际花费灵石（完成时填写）
  savedStones?: number; // 节省金额（完成时计算，actualStones<budgetStones 时为正）
  reward: TaskReward; // 完成时计算最终奖励
  note?: string;
  createTime: string;
  completeTime?: string;
}
