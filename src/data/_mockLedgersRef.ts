import type { LedgerItem } from '@/types/ledger';

// 共享 mock 账单数据（供 getLedgers / createLedger / deleteLedger 等共同使用）
export const mockLedgersRef: LedgerItem[] = [
  { id: 'l1', coupleId: 'mock_couple_001', amount: 8888, category: 'dress', note: '婚纱套餐定金', date: '2026-06-25', recorder: 'mock_openid_001', recorderName: '良人', recorderAvatar: 'https://picsum.photos/id/64/200/200', createTime: '2026-06-25 15:00:00', sourceType: 'manual' },
  { id: 'l2', coupleId: 'mock_couple_001', amount: 5000, category: 'hotel', note: '酒店场地预订', date: '2026-06-24', recorder: 'mock_openid_002', recorderName: '佳人', recorderAvatar: 'https://picsum.photos/id/91/200/200', createTime: '2026-06-24 11:00:00', sourceType: 'manual' },
  { id: 'l3', coupleId: 'mock_couple_001', amount: 1200, category: 'catering', note: '喜宴试菜', date: '2026-06-23', recorder: 'mock_openid_001', recorderName: '良人', recorderAvatar: 'https://picsum.photos/id/64/200/200', createTime: '2026-06-23 19:00:00', sourceType: 'manual' },
  { id: 'l4', coupleId: 'mock_couple_001', amount: 6666, category: 'gift', note: '伴郎伴娘礼金', date: '2026-06-22', recorder: 'mock_openid_002', recorderName: '佳人', recorderAvatar: 'https://picsum.photos/id/91/200/200', createTime: '2026-06-22 10:00:00', sourceType: 'manual' },
  { id: 'l5', coupleId: 'mock_couple_001', amount: 3500, category: 'decoration', note: '婚礼现场布置', date: '2026-06-21', recorder: 'mock_openid_001', recorderName: '良人', recorderAvatar: 'https://picsum.photos/id/64/200/200', createTime: '2026-06-21 14:00:00', sourceType: 'manual' },
  { id: 'l6', coupleId: 'mock_couple_001', amount: 888, category: 'other', note: '婚庆咨询费', date: '2026-06-20', recorder: 'mock_openid_002', recorderName: '佳人', recorderAvatar: 'https://picsum.photos/id/91/200/200', createTime: '2026-06-20 16:00:00', sourceType: 'manual' },
  // 降妖任务自动生成的账单（关联任务）
  { id: 'l7', coupleId: 'mock_couple_001', amount: 580, category: 'decoration', note: '降妖·设计请柬样式', date: '2026-06-27', recorder: 'mock_openid_002', recorderName: '佳人', recorderAvatar: 'https://picsum.photos/id/91/200/200', createTime: '2026-06-27 16:00:00', sourceType: 'task', taskId: 't5', taskTitle: '设计请柬样式' },
  { id: 'l8', coupleId: 'mock_couple_001', amount: 2200, category: 'other', note: '降妖·选定婚礼司仪', date: '2026-06-26', recorder: 'mock_openid_002', recorderName: '佳人', recorderAvatar: 'https://picsum.photos/id/91/200/200', createTime: '2026-06-26 18:00:00', sourceType: 'task', taskId: 't11', taskTitle: '选定婚礼司仪' },
  { id: 'l9', coupleId: 'mock_couple_001', amount: 2999, category: 'dress', note: '婚纱照拍摄', date: '2026-06-19', recorder: 'mock_openid_001', recorderName: '良人', recorderAvatar: 'https://picsum.photos/id/64/200/200', createTime: '2026-06-19 10:00:00', sourceType: 'manual' },
  { id: 'l10', coupleId: 'mock_couple_001', amount: 1500, category: 'catering', note: '订婚宴', date: '2026-06-18', recorder: 'mock_openid_002', recorderName: '佳人', recorderAvatar: 'https://picsum.photos/id/91/200/200', createTime: '2026-06-18 12:00:00', sourceType: 'manual' },
  { id: 'l11', coupleId: 'mock_couple_001', amount: 580, category: 'decoration', note: '请柬定制', date: '2026-06-17', recorder: 'mock_openid_001', recorderName: '良人', recorderAvatar: 'https://picsum.photos/id/64/200/200', createTime: '2026-06-17 15:00:00', sourceType: 'manual' },
  { id: 'l12', coupleId: 'mock_couple_001', amount: 6000, category: 'hotel', note: '婚宴尾款', date: '2026-06-16', recorder: 'mock_openid_002', recorderName: '佳人', recorderAvatar: 'https://picsum.photos/id/91/200/200', createTime: '2026-06-16 11:00:00', sourceType: 'manual' }
];

// 共享 mock 预算（含 stoneRate）
export const mockBudgetRef = {
  coupleId: 'mock_couple_001',
  totalBudget: 80000,
  stoneRate: 1, // 1 灵石 = 1 元
  categoryBudget: {
    dress: 18000,
    hotel: 25000,
    catering: 12000,
    gift: 10000,
    decoration: 8000,
    other: 7000
  },
  updateTime: '2026-06-20 10:00:00'
};
