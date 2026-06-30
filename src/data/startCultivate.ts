export default function startCultivate(data: { direction: string; duration: number }): Promise<{ sessionId: string }> {
  return Promise.resolve({ sessionId: 's' + Date.now() });
}
