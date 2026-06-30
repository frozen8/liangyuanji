import dayjs from 'dayjs';

// 格式化金额
export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

// 格式化日期
export function formatDate(date: string, template = 'YYYY-MM-DD'): string {
  return dayjs(date).format(template);
}

// 相对日期描述
export function relativeDate(date: string): string {
  const target = dayjs(date);
  const now = dayjs();
  const diff = target.diff(now, 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff > 0 && diff <= 7) return `${diff}天后`;
  if (diff < 0 && diff >= -7) return `${-diff}天前`;
  return target.format('MM-DD');
}

// 倒计时天数
export function daysUntil(date: string): number {
  return dayjs(date).diff(dayjs().startOf('day'), 'day');
}

// 格式化时长（分钟 → xhxmin）
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

// 格式化倒计时秒数为 mm:ss
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 限制范围
export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
