interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function getAchievements(): Promise<{ achievements: Achievement[] }> {
  const achievements: Achievement[] = [
    { id: 'a1', name: '姻缘初结', description: '完成首次双人绑定', emoji: '💞', unlocked: true, unlockedAt: '2026-06-01' },
    { id: 'a2', name: '破壳之喜', description: '灵兽孵化为幼兽', emoji: '🐣', unlocked: true, unlockedAt: '2026-06-15' },
    { id: 'a3', name: '初战告捷', description: '降服第一只妖兽', emoji: '⚔️', unlocked: true, unlockedAt: '2026-06-27' },
    { id: 'a4', name: '修炼入门', description: '完成首次番茄修炼', emoji: '🧘', unlocked: true, unlockedAt: '2026-06-10' },
    { id: 'a5', name: '持家有道', description: '记录第一笔账单', emoji: '💰', unlocked: true, unlockedAt: '2026-06-14' },
    { id: 'a6', name: '勤俭持家', description: '累计节省预算 1000 元', emoji: '🎯', unlocked: false },
    { id: 'a7', name: '降妖十连', description: '累计降服 10 只妖兽', emoji: '🗡️', unlocked: false },
    { id: 'a8', name: '双修有成', description: '与伴侣同修 10 次', emoji: '☯️', unlocked: false },
    { id: 'a9', name: '金丹大成', description: '境界突破至金丹', emoji: '🌟', unlocked: false },
    { id: 'a10', name: '飞升登仙', description: '迎来婚礼当日', emoji: '👰', unlocked: false }
  ];
  return Promise.resolve({ achievements });
}
