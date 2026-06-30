export default function exportData(): Promise<{ json: string }> {
  const data = {
    exportTime: new Date().toISOString(),
    couple: { id: 'mock_couple_001', weddingDate: '2026-10-01' },
    tasks: 12,
    ledgers: 12,
    cultivateSessions: 42,
    achievements: 5,
    beast: { name: '缘缘', stage: 'adult', realm: 'goldenCore' }
  };
  return Promise.resolve({ json: JSON.stringify(data, null, 2) });
}
