export interface FinishCultivateInput {
  sessionId: string;
}

export default function finishCultivate(data: FinishCultivateInput): Promise<{
  reward: { cultivation: number }; // 仅修为，不再涉及灵石
  beast: { id: string; stats: { satiety: number; mood: number; spirit: number; affinity: number } };
}> {
  return Promise.resolve({
    reward: { cultivation: 250 },
    beast: { id: 'mock_beast_001', stats: { satiety: 78, mood: 65, spirit: 80, affinity: 88 } }
  });
}
