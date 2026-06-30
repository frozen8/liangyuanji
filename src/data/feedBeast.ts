import type { Beast } from '@/types/beast';

export default function feedBeast(data: { action: string; delta: Partial<Beast['stats']> }): Promise<{ beast: Beast }> {
  const beast: Beast = {
    id: 'mock_beast_001',
    coupleId: 'mock_couple_001',
    name: '缘缘',
    stage: 'baby',
    level: 8,
    cultivation: 1680,
    realm: 'qiRefining',
    stats: { satiety: 78, mood: 65, spirit: 52, affinity: 88 },
    evolveTime: '2026-06-15 12:00:00'
  };
  return Promise.resolve({ beast });
}
