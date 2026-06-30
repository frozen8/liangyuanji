import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { CULTIVATE_DIRECTION_MAP } from '@/utils/constants';
import { formatDuration } from '@/utils/format';
import type { CultivateSession } from '@/types/cultivate';
import styles from './index.module.scss';

interface HistoryStats {
  totalCount: number;
  totalMinutes: number;
  totalCultivation: number;
  dualCount: number;
}

const CultivateHistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<CultivateSession[]>([]);
  const [stats, setStats] = useState<HistoryStats>({ totalCount: 0, totalMinutes: 0, totalCultivation: 0, dualCount: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  usePullDownRefresh(() => {
    loadHistory().finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await callFunction<{ sessions: CultivateSession[]; total: number; stats: HistoryStats }>(
        'getCultivateHistory',
        { page: 1, pageSize: 50 }
      );
      setSessions(res.sessions);
      setStats(res.stats);
    } catch (err) {
      console.error('[CultivateHistory] 加载失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 按日期分组
  const groupedSessions = useMemo(() => {
    const map = new Map<string, CultivateSession[]>();
    sessions.forEach((s) => {
      const date = s.startAt.slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(s);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  const formatDateLabel = (date: string): string => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (date === todayStr) return '今天';
    if (date === yesterdayStr) return '昨天';
    return `${date.slice(5)}`;
  };

  const formatTimeRange = (startAt: string, endAt?: string): string => {
    const start = startAt.slice(11, 16);
    const end = endAt ? endAt.slice(11, 16) : '--:--';
    return `${start} - ${end}`;
  };

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <View className={styles.historyPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>⏳</Text>
          <Text className={styles.loadingText}>修炼历史加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.historyPage}>
      <ScrollView scrollY className={styles.scrollArea}>
        {/* 统计总览 */}
        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>🧘 修炼总览</Text>
          <View className={styles.statsGrid}>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{stats.totalCount}</Text>
              <Text className={styles.statsLabel}>番茄数</Text>
            </View>
            <View className={styles.statsDivider} />
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{formatDuration(stats.totalMinutes)}</Text>
              <Text className={styles.statsLabel}>总时长</Text>
            </View>
            <View className={styles.statsDivider} />
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{stats.totalCultivation}</Text>
              <Text className={styles.statsLabel}>总修为</Text>
            </View>
          </View>
          <View className={styles.statsDual}>
            <Text className={styles.statsDualText}>💞 双修 {stats.dualCount} 次 · 加成 ×1.5</Text>
          </View>
        </View>

        {/* 历史记录 */}
        {groupedSessions.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyEmoji}>🧘</Text>
            <Text className={styles.emptyText}>暂无修炼记录</Text>
            <Text className={styles.emptyTip}>完成第一次修炼即可解锁历史</Text>
          </View>
        ) : (
          groupedSessions.map(([date, items]) => (
            <View key={date} className={styles.dateGroup}>
              <Text className={styles.dateLabel}>📅 {formatDateLabel(date)}</Text>
              <View className={styles.sessionList}>
                {items.map((s) => {
                  const dir = CULTIVATE_DIRECTION_MAP[s.direction];
                  const isExpanded = expandedId === s.id;
                  const isAbandoned = s.status === 'abandoned';
                  return (
                    <View
                      key={s.id}
                      className={`${styles.sessionCard} ${isAbandoned ? styles.sessionCardAbandoned : ''}`}
                      onClick={() => handleToggle(s.id)}
                    >
                      <View className={styles.sessionHeader}>
                        <Text className={styles.sessionEmoji}>{dir.emoji}</Text>
                        <View className={styles.sessionInfo}>
                          <Text className={styles.sessionDir}>{s.directionLabel}</Text>
                          <Text className={styles.sessionDuration}>{formatDuration(s.duration)}</Text>
                        </View>
                        {s.isDual && (
                          <Text className={styles.dualTag}>💞 双修</Text>
                        )}
                      </View>
                      <View className={styles.sessionReward}>
                        <Text className={styles.rewardItem}>✨ {s.reward.cultivation} 修为</Text>
                        <Text className={styles.sessionTime}>{formatTimeRange(s.startAt, s.endAt)}</Text>
                      </View>
                      {isAbandoned && (
                        <Text className={styles.abandonedTag}>已放弃</Text>
                      )}
                      {isExpanded && (
                        <View className={styles.sessionDetail}>
                          <View className={styles.detailRow}>
                            <Text className={styles.detailLabel}>开始时间</Text>
                            <Text className={styles.detailValue}>{s.startAt}</Text>
                          </View>
                          {s.endAt && (
                            <View className={styles.detailRow}>
                              <Text className={styles.detailLabel}>结束时间</Text>
                              <Text className={styles.detailValue}>{s.endAt}</Text>
                            </View>
                          )}
                          <View className={styles.detailRow}>
                            <Text className={styles.detailLabel}>修炼方向</Text>
                            <Text className={styles.detailValue}>{dir.emoji} {dir.name}</Text>
                          </View>
                          <View className={styles.detailRow}>
                            <Text className={styles.detailLabel}>修炼时长</Text>
                            <Text className={styles.detailValue}>{formatDuration(s.duration)}</Text>
                          </View>
                          <View className={styles.detailRow}>
                            <Text className={styles.detailLabel}>双修加成</Text>
                            <Text className={styles.detailValue}>{s.isDual ? '✅ 是 ×1.5' : '❌ 否'}</Text>
                          </View>
                          <View className={styles.detailRow}>
                            <Text className={styles.detailLabel}>完成状态</Text>
                            <Text className={styles.detailValue}>
                              {s.status === 'completed' ? '✅ 已完成' : s.status === 'abandoned' ? '❌ 已放弃' : '⏳ 进行中'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default CultivateHistoryPage;
