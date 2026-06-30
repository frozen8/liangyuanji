// 姻缘灵兽类型

// 灵兽形态阶段
export type BeastStage = 'egg' | 'baby' | 'adult' | 'divine';

// 境界
export type RealmLevel = 'mortal' | 'qiRefining' | 'foundation' | 'goldenCore' | 'nascentSoul' | 'spiritSevering' | 'ascension';

export interface BeastStats {
  satiety: number; // 饱食度 0-100
  mood: number; // 心情值 0-100
  spirit: number; // 灵力值 0-100
  affinity: number; // 好感度 0-100
}

export interface Beast {
  id: string;
  coupleId: string;
  name: string;
  stage: BeastStage;
  level: number; // 灵兽等级
  cultivation: number; // 当前修为
  realm: RealmLevel; // 双修境界
  stats: BeastStats;
  evolveTime: string;
}

export interface RealmInfo {
  level: RealmLevel;
  name: string; // 境界名
  requiredCultivation: number; // 升至此境界所需修为
  nextCultivation: number; // 下一境界所需修为
  description: string;
  unlocked: string; // 解锁内容
}
