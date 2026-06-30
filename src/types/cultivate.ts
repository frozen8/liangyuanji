// 修炼阁（番茄钟）类型

export type CultivateDirection =
  | 'dress'
  | 'invitation'
  | 'planning'
  | 'fitness'
  | 'study'
  | 'custom';

export type CultivateStatus = 'ongoing' | 'completed' | 'abandoned';

export interface CultivateSession {
  id: string;
  coupleId: string;
  direction: CultivateDirection;
  directionLabel: string;
  duration: number; // 时长（分钟）
  startAt: string;
  endAt?: string;
  isDual: boolean; // 是否双修
  status: CultivateStatus;
  reward: {
    cultivation: number; // 仅修为，不再涉及灵石
  };
  userOpenid: string;
}

export interface CultivateTodayStats {
  completedCount: number; // 完成番茄数
  totalMinutes: number; // 总时长
  totalCultivation: number; // 获得修为
}
