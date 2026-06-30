import type { CultivateSession } from '@/types/cultivate';

const mockHistory: CultivateSession[] = [
  {
    id: 's1', coupleId: 'mock_couple_001', direction: 'dress', directionLabel: '选婚纱',
    duration: 25, startAt: '2026-06-29 14:30:00', endAt: '2026-06-29 14:55:00',
    isDual: false, status: 'completed', reward: { cultivation: 250 }, userOpenid: 'u1'
  },
  {
    id: 's2', coupleId: 'mock_couple_001', direction: 'study', directionLabel: '学习备婚',
    duration: 50, startAt: '2026-06-29 10:00:00', endAt: '2026-06-29 10:50:00',
    isDual: true, status: 'completed', reward: { cultivation: 750 }, userOpenid: 'u1'
  },
  {
    id: 's3', coupleId: 'mock_couple_001', direction: 'fitness', directionLabel: '健身备婚',
    duration: 25, startAt: '2026-06-28 20:00:00', endAt: '2026-06-28 20:25:00',
    isDual: false, status: 'completed', reward: { cultivation: 250 }, userOpenid: 'u2'
  },
  {
    id: 's4', coupleId: 'mock_couple_001', direction: 'invitation', directionLabel: '写请柬',
    duration: 25, startAt: '2026-06-28 15:00:00', endAt: '2026-06-28 15:25:00',
    isDual: true, status: 'completed', reward: { cultivation: 375 }, userOpenid: 'u1'
  },
  {
    id: 's5', coupleId: 'mock_couple_001', direction: 'planning', directionLabel: '规划行程',
    duration: 50, startAt: '2026-06-27 19:00:00', endAt: '2026-06-27 19:50:00',
    isDual: false, status: 'completed', reward: { cultivation: 500 }, userOpenid: 'u2'
  },
  {
    id: 's6', coupleId: 'mock_couple_001', direction: 'dress', directionLabel: '选婚纱',
    duration: 25, startAt: '2026-06-27 14:00:00', endAt: '2026-06-27 14:25:00',
    isDual: false, status: 'completed', reward: { cultivation: 250 }, userOpenid: 'u1'
  },
  {
    id: 's7', coupleId: 'mock_couple_001', direction: 'fitness', directionLabel: '健身备婚',
    duration: 25, startAt: '2026-06-26 21:00:00', endAt: '2026-06-26 21:25:00',
    isDual: true, status: 'completed', reward: { cultivation: 375 }, userOpenid: 'u2'
  },
  {
    id: 's8', coupleId: 'mock_couple_001', direction: 'study', directionLabel: '学习备婚',
    duration: 50, startAt: '2026-06-26 10:00:00', endAt: '2026-06-26 10:50:00',
    isDual: false, status: 'completed', reward: { cultivation: 500 }, userOpenid: 'u1'
  },
  {
    id: 's9', coupleId: 'mock_couple_001', direction: 'planning', directionLabel: '规划行程',
    duration: 25, startAt: '2026-06-25 16:00:00', endAt: '2026-06-25 16:25:00',
    isDual: false, status: 'abandoned', reward: { cultivation: 0 }, userOpenid: 'u2'
  },
  {
    id: 's10', coupleId: 'mock_couple_001', direction: 'custom', directionLabel: '整理婚品',
    duration: 25, startAt: '2026-06-25 11:00:00', endAt: '2026-06-25 11:25:00',
    isDual: true, status: 'completed', reward: { cultivation: 375 }, userOpenid: 'u1'
  }
];

export default function getCultivateHistory(data?: {
  page?: number;
  pageSize?: number;
  month?: string;
}): Promise<{
  sessions: CultivateSession[];
  total: number;
  stats: { totalCount: number; totalMinutes: number; totalCultivation: number; dualCount: number };
}> {
  let sessions = mockHistory;
  if (data?.month) {
    sessions = sessions.filter((s) => s.startAt.startsWith(data.month!));
  }
  const total = sessions.length;
  const completed = sessions.filter((s) => s.status === 'completed');
  const stats = {
    totalCount: completed.length,
    totalMinutes: completed.reduce((sum, s) => sum + s.duration, 0),
    totalCultivation: completed.reduce((sum, s) => sum + s.reward.cultivation, 0),
    dualCount: completed.filter((s) => s.isDual).length
  };
  return Promise.resolve({ sessions, total, stats });
}
