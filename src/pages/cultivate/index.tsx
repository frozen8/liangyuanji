import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { CULTIVATE_DIRECTION_MAP, CULTIVATE_DURATION_OPTIONS, REALM_LIST, BEAST_STAGE_MAP } from '@/utils/constants';
import { formatCountdown, formatDuration } from '@/utils/format';
import type { CultivateDirection } from '@/types/cultivate';
import { useCoupleGuard } from '@/hooks/useCoupleGuard';
import { callFunction } from '@/services/cloud';
import { useAppStore } from '@/store/useAppStore';
import styles from './index.module.scss';

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

const DIRECTIONS: Array<{ key: CultivateDirection | 'custom'; name: string; emoji: string }> = [
  { key: 'dress', name: '选婚纱', emoji: '👰' },
  { key: 'invitation', name: '写请柬', emoji: '💌' },
  { key: 'planning', name: '规划行程', emoji: '🗺️' },
  { key: 'fitness', name: '健身备婚', emoji: '💪' },
  { key: 'study', name: '学习备婚', emoji: '📖' },
  { key: 'custom', name: '自定义', emoji: '✨' }
];

interface Breakthrough {
  type: string;
  from?: string;
  to?: string;
  fromStage?: string;
  toStage?: string;
}

const CultivatePage: React.FC = () => {
  useCoupleGuard();
  const { coupleId, setBeast } = useAppStore();
  const [direction, setDirection] = useState<CultivateDirection | 'custom'>('dress');
  const [customDirection, setCustomDirection] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [remainSeconds, setRemainSeconds] = useState(25 * 60);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [todayCount, setTodayCount] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todayCultivation, setTodayCultivation] = useState(0);
  const [tomatoCount, setTomatoCount] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimestampRef = useRef<number>(0);

  const totalSeconds = duration * 60;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setStatus('running');
    startTimestampRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setRemainSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          completeTimer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('paused');
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    setRemainSeconds(totalSeconds);
    setSessionId('');
  };

  const completeTimer = async (isEarlyEnd: boolean) => {
    if (submitting) return;
    setStatus('completed');
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    const actualDuration = isEarlyEnd
      ? Math.ceil((Date.now() - startTimestampRef.current) / 60000)
      : duration;

    try {
      const res = await callFunction<{
        reward: { cultivation: number; tomato: number };
        beast: any;
        breakthrough: Breakthrough | null;
        isEarlyEnd: boolean;
      }>('finishCultivate', {
        sessionId,
        isEarlyEnd,
        actualDuration
      });

      const rewardCultivation = res.reward.cultivation;
      setTodayCount((c) => c + 1);
      setTodayMinutes((m) => m + actualDuration);
      setTodayCultivation((c) => c + rewardCultivation);
      setTomatoCount((c) => c + res.reward.tomato);

      if (res.beast) {
        setBeast(res.beast);
      }

      let breakthroughText = '';
      if (res.breakthrough) {
        const b = res.breakthrough;
        if (b.type === 'realm' || b.type === 'both') {
          const toRealm = REALM_LIST.find((r) => r.level === b.to);
          if (toRealm) breakthroughText += `\n🎊 境界突破：${toRealm.name}！${toRealm.unlocked}`;
        }
        if (b.type === 'stage' || b.type === 'both') {
          const toStage = b.toStage || b.to;
          const stageInfo = BEAST_STAGE_MAP[toStage];
          if (stageInfo) breakthroughText += `\n${stageInfo.emoji} 灵兽进化：${stageInfo.name}！`;
        }
      }

      const earlyEndNote = isEarlyEnd ? `\n⚠️ 提前终止，修为减半` : '';

      Taro.showModal({
        title: isEarlyEnd ? '🧘 修炼终止' : '🧘 修炼圆满',
        content: `本次修炼 ${actualDuration} 分钟${earlyEndNote}\n获得 ✨${rewardCultivation} 修为\n🍅 番茄 +${res.reward.tomato}\n灵兽灵力已充能！${breakthroughText}`,
        showCancel: false,
        confirmText: '收下奖励',
        confirmColor: '#F7B500',
        success: () => {
          resetTimer();
        }
      });
    } catch (err: any) {
      console.error('[Cultivate] 提交修炼失败:', err);
      Taro.showToast({ title: err.message || '修炼提交失败', icon: 'none' });
      resetTimer();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    if (status === 'paused') {
      startTimer();
      return;
    }
    if (status !== 'idle' && status !== 'completed') return;

    // 验证自定义方向
    const finalDirection = direction === 'custom' ? customDirection.trim() : direction;
    if (!finalDirection) {
      Taro.showToast({ title: '请输入修炼方向', icon: 'none' });
      return;
    }

    // 验证自定义时长
    if (isCustomDuration) {
      const d = parseInt(customDuration, 10);
      if (!d || d < 1 || d > 180) {
        Taro.showToast({ title: '时长需在 1-180 分钟', icon: 'none' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await callFunction<{ sessionId: string }>('startCultivate', {
        coupleId,
        direction: finalDirection,
        duration
      });
      setSessionId(res.sessionId);
      setRemainSeconds(totalSeconds);
      startTimer();
    } catch (err: any) {
      console.error('[Cultivate] 开始修炼失败:', err);
      Taro.showToast({ title: err.message || '开始失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminate = () => {
    Taro.showModal({
      title: '终止修炼',
      content: '提前终止将获得减半修为，番茄不变。确认终止？',
      confirmText: '终止',
      confirmColor: '#F53F3F',
      success: (modalRes) => {
        if (modalRes.confirm) {
          completeTimer(true);
        }
      }
    });
  };

  const handleDirectionChange = (d: CultivateDirection | 'custom') => {
    if (status === 'running' || status === 'paused') {
      Taro.showToast({ title: '修炼中无法切换方向', icon: 'none' });
      return;
    }
    setDirection(d);
  };

  const handleDurationChange = (d: number | 'custom') => {
    if (status === 'running' || status === 'paused') {
      Taro.showToast({ title: '修炼中无法切换时长', icon: 'none' });
      return;
    }
    if (d === 'custom') {
      setIsCustomDuration(true);
    } else {
      setIsCustomDuration(false);
      setDuration(d);
      setRemainSeconds(d * 60);
    }
  };

  // 自定义时长输入实时同步到 duration 和 remainSeconds
  const handleCustomDurationInput = (e: any) => {
    const val = e.detail.value;
    setCustomDuration(val);
    const d = parseInt(val, 10);
    if (d && d > 0 && d <= 180) {
      setDuration(d);
      setRemainSeconds(d * 60);
    }
  };

  const progress = totalSeconds > 0 ? (totalSeconds - remainSeconds) / totalSeconds : 0;
  const angle = progress * 360;

  const directionInfo = direction === 'custom'
    ? { emoji: '✨', name: customDirection || '自定义' }
    : CULTIVATE_DIRECTION_MAP[direction as CultivateDirection];
  const statusText = status === 'running' ? '修炼中...' : status === 'paused' ? '已暂停' : status === 'completed' ? '已圆满' : submitting ? '准备中...' : '静心准备';

  return (
    <View className={styles.cultivatePage}>
      {/* 今日统计 */}
      <View className={styles.todayStats}>
        <View className={styles.todayItem}>
          <Text className={styles.todayValue}>{todayCount}</Text>
          <Text className={styles.todayLabel}>🍅 番茄</Text>
        </View>
        <View className={styles.todayItem}>
          <Text className={styles.todayValue}>{formatDuration(todayMinutes)}</Text>
          <Text className={styles.todayLabel}>时长</Text>
        </View>
        <View className={styles.todayItem}>
          <Text className={styles.todayValue}>{todayCultivation}</Text>
          <Text className={styles.todayLabel}>✨ 修为</Text>
        </View>
      </View>

      {/* 番茄库存提示 */}
      {tomatoCount > 0 && (
        <View className={styles.tomatoHint}>
          <Text className={styles.tomatoHintText}>🍅 番茄库存：{tomatoCount}（可用于投喂灵兽）</Text>
        </View>
      )}

      {/* 番茄钟 */}
      <View className={styles.timerCard}>
        <View className={styles.directionTag}>
          <Text className={styles.directionText}>{directionInfo.emoji} {directionInfo.name}</Text>
        </View>

        <View className={styles.timerRing}>
          <View
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `conic-gradient(#F7B500 ${angle}deg, #FAF0F4 0deg)`
            }}
          />
          <View
            style={{
              position: 'absolute',
              inset: '20rpx',
              borderRadius: '50%',
              background: '#FFFFFF'
            }}
          />
          <View className={styles.timerContent}>
            <Text className={styles.timerTime}>{formatCountdown(remainSeconds)}</Text>
            <Text className={styles.timerStatus}>{statusText}</Text>
          </View>
        </View>

        {/* 方向选择 */}
        <Text className={styles.sectionTitle}>修炼方向</Text>
        <View className={styles.directionGrid}>
          {DIRECTIONS.map((d) => (
            <View
              key={d.key}
              className={classnames(styles.directionItem, direction === d.key && styles.directionItemActive)}
              onClick={() => handleDirectionChange(d.key)}
            >
              <Text className={styles.directionEmoji}>{d.emoji}</Text>
              <Text className={classnames(styles.directionName, direction === d.key && styles.directionNameActive)}>{d.name}</Text>
            </View>
          ))}
        </View>

        {/* 自定义方向输入 */}
        {direction === 'custom' && (
          <Input
            className={styles.customInput}
            placeholder="输入修炼方向（如：冥想、瑜伽）"
            value={customDirection}
            onInput={(e) => setCustomDirection(e.detail.value)}
            maxlength={10}
          />
        )}

        {/* 时长选择 */}
        <Text className={styles.sectionTitle}>修炼时长</Text>
        <View className={styles.durationRow}>
          {CULTIVATE_DURATION_OPTIONS.map((opt) => (
            <View
              key={opt.value}
              className={classnames(styles.durationItem, !isCustomDuration && duration === opt.value && styles.durationItemActive)}
              onClick={() => handleDurationChange(opt.value)}
            >
              <Text className={classnames(styles.durationText, !isCustomDuration && duration === opt.value && styles.durationTextActive)}>{opt.label}</Text>
            </View>
          ))}
          <View
            className={classnames(styles.durationItem, isCustomDuration && styles.durationItemActive)}
            onClick={() => handleDurationChange('custom')}
          >
            <Text className={classnames(styles.durationText, isCustomDuration && styles.durationTextActive)}>自定义</Text>
          </View>
        </View>

        {/* 自定义时长输入 */}
        {isCustomDuration && (
          <View className={styles.customDurationRow}>
            <Input
              className={styles.customInput}
              type="number"
            placeholder="输入分钟数（1-180）"
            value={customDuration}
            onInput={handleCustomDurationInput}
            maxlength={3}
            />
            <Text className={styles.customDurationSuffix}>分钟</Text>
          </View>
        )}

        {/* 操作按钮 */}
        <View className={styles.actionRow}>
          {status === 'running' ? (
            <>
              <View className={`${styles.actionBtn} ${styles.pauseBtn}`} onClick={pauseTimer}>
                <Text className={styles.actionText}>⏸ 暂停</Text>
              </View>
              <View className={`${styles.actionBtn} ${styles.terminateBtn}`} onClick={handleTerminate}>
                <Text className={styles.actionText}>🛑 终止</Text>
              </View>
            </>
          ) : status === 'paused' ? (
            <>
              <View
                className={`${styles.actionBtn} ${styles.startBtn} ${submitting ? styles.actionBtnDisabled : ''}`}
                onClick={submitting ? undefined : handleStart}
              >
                <Text className={styles.actionText}>▶ 继续</Text>
              </View>
              <View className={`${styles.actionBtn} ${styles.terminateBtn}`} onClick={handleTerminate}>
                <Text className={styles.actionText}>🛑 终止</Text>
              </View>
            </>
          ) : (
            <View
              className={`${styles.actionBtn} ${styles.startBtn} ${submitting ? styles.actionBtnDisabled : ''}`}
              onClick={submitting ? undefined : handleStart}
            >
              <Text className={styles.actionText}>{submitting ? '准备中...' : '🧘 开始修炼'}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 修炼历史入口 */}
      <View className={styles.historyEntry} onClick={() => Taro.navigateTo({ url: '/pages/cultivate-history/index' })}>
        <View className={styles.historyLeft}>
          <Text className={styles.historyEmoji}>📜</Text>
          <Text className={styles.historyText}>修炼历史</Text>
        </View>
        <Text className={styles.historyArrow}>›</Text>
      </View>
    </View>
  );
};

export default CultivatePage;
