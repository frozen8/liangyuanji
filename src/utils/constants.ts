import type { RealmLevel } from '@/types/beast';
import type { TaskCategory, TaskStatus } from '@/types/task';
import type { LedgerCategory } from '@/types/ledger';
import type { CultivateDirection } from '@/types/cultivate';

// 境界表
export const REALM_LIST: Array<{
  level: RealmLevel;
  name: string;
  minCultivation: number;
  maxCultivation: number;
  description: string;
  unlocked: string;
}> = [
  { level: 'mortal', name: '凡人', minCultivation: 0, maxCultivation: 500, description: '初入红尘，姻缘初结', unlocked: '初始灵兽蛋' },
  { level: 'qiRefining', name: '练气', minCultivation: 500, maxCultivation: 2000, description: '姻缘初凝，灵兽孵化', unlocked: '灵兽孵化为幼兽' },
  { level: 'foundation', name: '筑基', minCultivation: 2000, maxCultivation: 5000, description: '道基初成，灵兽渐强', unlocked: '灵兽装饰商店' },
  { level: 'goldenCore', name: '金丹', minCultivation: 5000, maxCultivation: 12000, description: '金丹大成，灵兽成兽', unlocked: '灵兽进化为成兽' },
  { level: 'nascentSoul', name: '元婴', minCultivation: 12000, maxCultivation: 25000, description: '元婴出窍，双修大成', unlocked: '双修场景皮肤' },
  { level: 'spiritSevering', name: '化神', minCultivation: 25000, maxCultivation: 999999, description: '化神入境，灵兽神兽', unlocked: '灵兽进化为神兽' },
  { level: 'ascension', name: '飞升', minCultivation: 999999, maxCultivation: 999999, description: '婚礼当日，飞升登仙', unlocked: '飞升典礼' }
];

// 灵兽形态映射
export const BEAST_STAGE_MAP: Record<string, { name: string; emoji: string }> = {
  egg: { name: '姻缘蛋', emoji: '🥚' },
  baby: { name: '幼兽', emoji: '🐣' },
  adult: { name: '成兽', emoji: '🦄' },
  divine: { name: '神兽', emoji: '🐉' }
};

// 任务分类映射（降妖录妖兽类型）
export const TASK_CATEGORY_MAP: Record<TaskCategory, { name: string; emoji: string; color: string }> = {
  dress: { name: '婚纱妖', emoji: '👰', color: '#FF6B9D' },
  hotel: { name: '酒店妖', emoji: '🏨', color: '#3DAA9A' },
  banquet: { name: '喜宴妖', emoji: '🍽️', color: '#F7B500' },
  invitation: { name: '请柬妖', emoji: '💌', color: '#C779D0' },
  gift: { name: '礼金妖', emoji: '🧧', color: '#E54B7D' },
  shopping: { name: '采购妖', emoji: '🛍️', color: '#5CBFB0' },
  other: { name: '杂事妖', emoji: '👻', color: '#A89AAC' }
};

// 任务状态映射
export const TASK_STATUS_MAP: Record<TaskStatus, { name: string; color: string }> = {
  pending: { name: '待降服', color: '#FF7D00' },
  doing: { name: '进行中', color: '#165DFF' },
  done: { name: '已降服', color: '#00B42A' },
  overdue: { name: '已逾期', color: '#F53F3F' }
};

// 账单分类映射
export const LEDGER_CATEGORY_MAP: Record<LedgerCategory, { name: string; emoji: string; color: string }> = {
  dress: { name: '婚纱', emoji: '👰', color: '#FF6B9D' },
  hotel: { name: '酒店', emoji: '🏨', color: '#3DAA9A' },
  catering: { name: '餐饮', emoji: '🍽️', color: '#F7B500' },
  gift: { name: '礼金', emoji: '🧧', color: '#E54B7D' },
  decoration: { name: '装饰', emoji: '🎀', color: '#C779D0' },
  other: { name: '其他', emoji: '📦', color: '#A89AAC' }
};

// 修炼方向映射
export const CULTIVATE_DIRECTION_MAP: Record<CultivateDirection, { name: string; emoji: string }> = {
  dress: { name: '选婚纱', emoji: '👰' },
  invitation: { name: '写请柬', emoji: '💌' },
  planning: { name: '规划行程', emoji: '🗺️' },
  fitness: { name: '健身备婚', emoji: '💪' },
  study: { name: '学习备婚', emoji: '📖' },
  custom: { name: '自定义', emoji: '✨' }
};

// 番茄钟时长选项
export const CULTIVATE_DURATION_OPTIONS = [
  { value: 15, label: '15min · 短修' },
  { value: 25, label: '25min · 标准' },
  { value: 50, label: '50min · 长修' }
];

// 难度星级映射
export const DIFFICULTY_MAP: Record<number, { name: string; emoji: string; attack: number }> = {
  1: { name: '小妖', emoji: '⭐', attack: 10 },
  2: { name: '中妖', emoji: '⭐⭐', attack: 20 },
  3: { name: '大妖', emoji: '⭐⭐⭐', attack: 35 },
  4: { name: '妖将', emoji: '⭐⭐⭐⭐', attack: 55 },
  5: { name: '妖王', emoji: '⭐⭐⭐⭐⭐', attack: 80 }
};
