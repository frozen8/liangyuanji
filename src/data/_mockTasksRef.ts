import type { Task } from '@/types/task';

// 共享 mock 任务数据（供 getTasks / updateTask / deleteTask 等共同使用）
// 注意：mock 模式下内存数据，刷新即重置
export const mockTasksRef: Task[] = [
  {
    id: 't1', coupleId: 'mock_couple_001', title: '试穿婚纱', category: 'dress', difficulty: 3,
    deadline: '2026-06-29', status: 'pending', assigneeName: '良人',
    budgetStones: 8888,
    reward: { cultivation: 105, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-20 10:00:00'
  },
  {
    id: 't2', coupleId: 'mock_couple_001', title: '确定酒店场地', category: 'hotel', difficulty: 4,
    deadline: '2026-07-05', status: 'doing', assigneeName: '佳人',
    budgetStones: 25000,
    reward: { cultivation: 140, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-22 14:00:00'
  },
  {
    id: 't3', coupleId: 'mock_couple_001', title: '拟定宾客名单', category: 'invitation', difficulty: 2,
    deadline: '2026-07-10', status: 'pending',
    budgetStones: 500,
    reward: { cultivation: 70, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-25 09:00:00'
  },
  {
    id: 't4', coupleId: 'mock_couple_001', title: '选定婚庆公司', category: 'shopping', difficulty: 3,
    deadline: '2026-07-15', status: 'pending', assigneeName: '良人',
    budgetStones: 12000,
    reward: { cultivation: 105, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-26 11:00:00'
  },
  {
    id: 't5', coupleId: 'mock_couple_001', title: '设计请柬样式', category: 'invitation', difficulty: 2,
    deadline: '2026-06-28', status: 'done', assigneeName: '佳人', completeTime: '2026-06-27 16:00:00',
    budgetStones: 800, actualStones: 580, savedStones: 220,
    reward: { cultivation: 92, moodBonus: 3, savedBonus: 22 }, createTime: '2026-06-18 10:00:00'
  },
  {
    id: 't6', coupleId: 'mock_couple_001', title: '确定喜宴菜单', category: 'banquet', difficulty: 2,
    deadline: '2026-08-01', status: 'pending',
    budgetStones: 12000,
    reward: { cultivation: 70, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-27 15:00:00'
  },
  {
    id: 't7', coupleId: 'mock_couple_001', title: '准备伴郎伴娘礼金', category: 'gift', difficulty: 1,
    deadline: '2026-09-01', status: 'pending',
    budgetStones: 6666,
    reward: { cultivation: 35, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-28 09:00:00'
  },
  {
    id: 't8', coupleId: 'mock_couple_001', title: '婚纱照外景踩点', category: 'dress', difficulty: 2,
    deadline: '2026-06-25', status: 'overdue',
    budgetStones: 3000,
    reward: { cultivation: 70, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-10 10:00:00'
  },
  {
    id: 't9', coupleId: 'mock_couple_001', title: '订购婚戒', category: 'shopping', difficulty: 3,
    deadline: '2026-08-10', status: 'doing', assigneeName: '良人',
    budgetStones: 15000,
    reward: { cultivation: 105, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-21 14:00:00'
  },
  {
    id: 't10', coupleId: 'mock_couple_001', title: '婚礼彩排安排', category: 'other', difficulty: 4,
    deadline: '2026-09-28', status: 'pending',
    budgetStones: 5000,
    reward: { cultivation: 140, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-29 10:00:00'
  },
  {
    id: 't11', coupleId: 'mock_couple_001', title: '选定婚礼司仪', category: 'other', difficulty: 2,
    deadline: '2026-07-20', status: 'done', assigneeName: '佳人', completeTime: '2026-06-26 18:00:00',
    budgetStones: 2000, actualStones: 2200, savedStones: -200,
    reward: { cultivation: 70, moodBonus: -5, savedBonus: 0 }, createTime: '2026-06-15 10:00:00'
  },
  {
    id: 't12', coupleId: 'mock_couple_001', title: '确认蜜月行程', category: 'other', difficulty: 3,
    deadline: '2026-09-15', status: 'pending',
    budgetStones: 20000,
    reward: { cultivation: 105, moodBonus: 0, savedBonus: 0 }, createTime: '2026-06-28 16:00:00'
  }
];
