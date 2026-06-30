// 灵石簿（账本）类型

import type { TaskCategory } from './task';

export type LedgerCategory = 'dress' | 'hotel' | 'catering' | 'gift' | 'decoration' | 'other';

// 账单来源：task=降妖任务自动生成，manual=独立记账
export type LedgerSourceType = 'task' | 'manual';

export interface LedgerItem {
  id: string;
  coupleId: string;
  amount: number; // 灵石数
  category: LedgerCategory;
  note: string;
  date: string; // YYYY-MM-DD
  recorder: string; // 记账人 openid
  recorderName: string;
  recorderAvatar: string;
  createTime: string;
  sourceType: LedgerSourceType; // 账单来源
  taskId?: string; // 关联任务ID（sourceType='task' 时存在）
  taskTitle?: string; // 关联任务标题（冗余展示用）
}

export interface Budget {
  coupleId: string;
  totalBudget: number; // 灵石池总量（以灵石为单位）
  stoneRate: number; // 灵石与人民币换算比例（创建关系时设定，不可修改）。人民币 = 灵石 × stoneRate
  categoryBudget: Record<LedgerCategory, number>;
  updateTime: string;
}

export interface BudgetStatus {
  total: number; // 灵石池总量
  spent: number; // 已花灵石
  remain: number; // 结余灵石
  spentPercent: number;
  isOverBudget: boolean;
  stoneRate: number; // 换算比例
  remainRmb: number; // 结余人民币换算值
  spentRmb: number; // 已花人民币换算值
}

export interface CategoryStat {
  category: LedgerCategory;
  amount: number; // 灵石数
  percent: number;
}

// 降妖任务类型 → 灵石簿分类映射
export const TASK_TO_LEDGER_CATEGORY: Record<TaskCategory, LedgerCategory> = {
  dress: 'dress',
  hotel: 'hotel',
  banquet: 'catering',
  invitation: 'decoration',
  gift: 'gift',
  shopping: 'other',
  other: 'other'
};
