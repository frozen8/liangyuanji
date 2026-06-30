import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { LEDGER_CATEGORY_MAP } from '@/utils/constants';
import type { LedgerItem as LedgerItemType, CategoryStat, Budget } from '@/types/ledger';
import styles from './index.module.scss';

interface LedgerStatsData {
  totalSpent: number;
  categoryStats: CategoryStat[];
  recorderStats: Array<{ openid: string; name: string; avatar: string; amount: number }>;
  sourceStats: { taskAmount: number; manualAmount: number; taskCount: number; manualCount: number };
}

const LedgerStatsPage: React.FC = () => {
  const [ledgers, setLedgers] = useState<LedgerItemType[]>([]);
  const [statsData, setStatsData] = useState<LedgerStatsData | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>('all');

  useEffect(() => {
    loadStats();
  }, [monthFilter]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = monthFilter === 'all' ? {} : { month: monthFilter };
      const [ledgerRes, budgetRes] = await Promise.all([
        callFunction<{ ledgers: LedgerItemType[]; stats: LedgerStatsData }>('getLedgers', data),
        callFunction<{ budget: Budget }>('getBudget', {})
      ]);
      setLedgers(ledgerRes.ledgers);
      setStatsData(ledgerRes.stats);
      setBudget(budgetRes.budget);
    } catch (err) {
      console.error('[LedgerStats] 加载失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 每日支出趋势（最近 7 天）
  const dailyTrend = useMemo(() => {
    const days: Array<{ date: string; label: string; amount: number }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const amount = ledgers.filter((l) => l.date === dateStr).reduce((s, l) => s + l.amount, 0);
      days.push({ date: dateStr, label, amount });
    }
    return days;
  }, [ledgers]);

  const maxDailyAmount = Math.max(...dailyTrend.map((d) => d.amount), 1);

  // 预算建议
  const budgetAdvices = useMemo(() => {
    if (!budget) return [];
    const advices: Array<{ type: 'warn' | 'ok' | 'danger'; text: string }> = [];
    const totalSpent = statsData?.totalSpent || 0;
    const totalPercent = budget.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;
    if (totalPercent > 90) {
      advices.push({ type: 'danger', text: `总预算已用 ${Math.round(totalPercent)}%，即将超支` });
    }
    statsData?.categoryStats.forEach((cs) => {
      const catBudget = budget.categoryBudget[cs.category] || 0;
      if (catBudget === 0) return;
      const percent = (cs.amount / catBudget) * 100;
      if (percent >= 100) {
        advices.push({ type: 'danger', text: `${LEDGER_CATEGORY_MAP[cs.category].name}类已超支 ${Math.round(percent - 100)}%` });
      } else if (percent >= 80) {
        advices.push({ type: 'warn', text: `${LEDGER_CATEGORY_MAP[cs.category].name}类已用 ${Math.round(percent)}%，注意控制` });
      } else if (percent <= 30 && cs.amount > 0) {
        advices.push({ type: 'ok', text: `${LEDGER_CATEGORY_MAP[cs.category].name}类预算充足（${Math.round(percent)}%）` });
      }
    });
    if (advices.length === 0) {
      advices.push({ type: 'ok', text: '各项支出均在合理范围内' });
    }
    return advices;
  }, [budget, statsData]);

  const stoneRate = budget?.stoneRate || 1;
  const totalSpent = statsData?.totalSpent || 0;
  const totalBudget = budget?.totalBudget || 0;
  const remain = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const isOverBudget = totalSpent > totalBudget;

  // 双人对比
  const totalRecorderAmount = (statsData?.recorderStats || []).reduce((s, r) => s + r.amount, 0);

  if (loading) {
    return (
      <View className={styles.statsPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>⏳</Text>
          <Text className={styles.loadingText}>统计加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.statsPage}>
      {/* 时间筛选 */}
      <View className={styles.monthBar}>
        <Text className={styles.monthLabel}>📅 时间筛选</Text>
        <View className={styles.monthTabs}>
          <Text
            className={`${styles.monthTab} ${monthFilter === 'all' ? styles.monthTabActive : ''}`}
            onClick={() => setMonthFilter('all')}
          >全部</Text>
          <Text
            className={`${styles.monthTab} ${monthFilter === '2026-06' ? styles.monthTabActive : ''}`}
            onClick={() => setMonthFilter('2026-06')}
          >6月</Text>
          <Text
            className={`${styles.monthTab} ${monthFilter === '2026-05' ? styles.monthTabActive : ''}`}
            onClick={() => setMonthFilter('2026-05')}
          >5月</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.scrollArea}>
        {/* 总览卡片（金额双显） */}
        <View className={styles.overviewCard}>
          <Text className={styles.overviewTitle}>💎 灵石池总览</Text>
          <View className={styles.overviewAmountRow}>
            <Text className={styles.overviewSpent}>已花 {totalSpent} 灵石</Text>
            <Text className={styles.overviewBudget}>/ {totalBudget}</Text>
          </View>
          <Text className={styles.overviewRmb}>≈ ¥{(totalSpent * stoneRate).toFixed(2)} / ¥{(totalBudget * stoneRate).toFixed(2)}</Text>
          <View className={styles.progressBar}>
            <View
              className={`${styles.progressBarFill} ${isOverBudget ? styles.progressBarFillDanger : ''}`}
              style={{ width: `${Math.min(spentPercent, 100)}%` }}
            />
          </View>
          <View className={styles.overviewFooter}>
            <Text className={styles.overviewPercent}>{spentPercent}%</Text>
            <Text className={`${styles.overviewRemain} ${isOverBudget ? styles.overviewRemainWarn : ''}`}>
              {isOverBudget ? `超支 ${Math.abs(remain)} 灵石` : `结余 ${remain} 灵石`}
            </Text>
          </View>
        </View>

        {/* 支出来源占比（降妖 vs 独立） */}
        {statsData?.sourceStats && (
          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>⚔️ 支出来源占比</Text>
            <View className={styles.rankList}>
              <View className={styles.rankItem}>
                <View className={styles.rankHeader}>
                  <Text className={styles.rankIndex}>降妖</Text>
                  <Text className={styles.rankLabel}>⚔️ 任务支出</Text>
                  <Text className={styles.rankAmount}>{statsData.sourceStats.taskAmount} 灵石</Text>
                  <Text className={styles.rankPercent}>
                    {totalSpent > 0 ? Math.round((statsData.sourceStats.taskAmount / totalSpent) * 100) : 0}%
                  </Text>
                </View>
                <View className={styles.rankBar}>
                  <View
                    className={styles.rankBarFill}
                    style={{ width: `${totalSpent > 0 ? Math.round((statsData.sourceStats.taskAmount / totalSpent) * 100) : 0}%`, background: '#FF6B9D' }}
                  />
                </View>
                <Text className={styles.rankCount}>{statsData.sourceStats.taskCount} 笔账单</Text>
              </View>
              <View className={styles.rankItem}>
                <View className={styles.rankHeader}>
                  <Text className={styles.rankIndex}>独立</Text>
                  <Text className={styles.rankLabel}>✍️ 手动记账</Text>
                  <Text className={styles.rankAmount}>{statsData.sourceStats.manualAmount} 灵石</Text>
                  <Text className={styles.rankPercent}>
                    {totalSpent > 0 ? Math.round((statsData.sourceStats.manualAmount / totalSpent) * 100) : 0}%
                  </Text>
                </View>
                <View className={styles.rankBar}>
                  <View
                    className={styles.rankBarFill}
                    style={{ width: `${totalSpent > 0 ? Math.round((statsData.sourceStats.manualAmount / totalSpent) * 100) : 0}%`, background: '#A89AAC' }}
                  />
                </View>
                <Text className={styles.rankCount}>{statsData.sourceStats.manualCount} 笔账单</Text>
              </View>
            </View>
          </View>
        )}

        {/* 分类支出排行 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📊 分类支出排行</Text>
          <View className={styles.rankList}>
            {(statsData?.categoryStats || []).map((cs, idx) => {
              const cat = LEDGER_CATEGORY_MAP[cs.category];
              const maxAmount = statsData?.categoryStats[0]?.amount || 1;
              const widthPercent = Math.round((cs.amount / maxAmount) * 100);
              return (
                <View key={cs.category} className={styles.rankItem}>
                  <View className={styles.rankHeader}>
                    <Text className={styles.rankIndex}>No.{idx + 1}</Text>
                    <Text className={styles.rankLabel}>{cat.emoji} {cat.name}</Text>
                    <Text className={styles.rankAmount}>{cs.amount} 灵石</Text>
                    <Text className={styles.rankPercent}>{cs.percent}%</Text>
                  </View>
                  <View className={styles.rankBar}>
                    <View
                      className={styles.rankBarFill}
                      style={{ width: `${widthPercent}%`, background: cat.color }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 双人记账对比 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>👫 双人记账对比</Text>
          <View className={styles.compareRow}>
            {(statsData?.recorderStats || []).map((r) => {
              const percent = totalRecorderAmount > 0 ? Math.round((r.amount / totalRecorderAmount) * 100) : 0;
              return (
                <View key={r.openid} className={styles.compareCol}>
                  <Text className={styles.compareAvatar}>{r.avatar ? '👤' : '👤'}</Text>
                  <Text className={styles.compareName}>{r.name}</Text>
                  <Text className={styles.compareAmount}>{r.amount} 灵石</Text>
                  <Text className={styles.comparePercent}>{percent}%</Text>
                </View>
              );
            })}
            {(statsData?.recorderStats.length || 0) === 2 && (
              <Text className={styles.compareVS}>VS</Text>
            )}
          </View>
        </View>

        {/* 每日支出趋势 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📈 近 7 日支出趋势</Text>
          <View className={styles.trendChart}>
            {dailyTrend.map((d) => {
              const heightPercent = Math.round((d.amount / maxDailyAmount) * 100);
              return (
                <View key={d.date} className={styles.trendCol}>
                  <View className={styles.trendBarWrap}>
                    <View
                      className={styles.trendBar}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </View>
                  <Text className={styles.trendAmount}>{d.amount > 0 ? `${d.amount}` : '-'}</Text>
                  <Text className={styles.trendDate}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 预算建议 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>💡 预算建议</Text>
          <View className={styles.adviceList}>
            {budgetAdvices.map((adv, idx) => (
              <View key={idx} className={`${styles.adviceItem} ${adv.type === 'warn' ? styles.adviceWarn : adv.type === 'danger' ? styles.adviceDanger : styles.adviceOk}`}>
                <Text className={styles.adviceIcon}>
                  {adv.type === 'warn' ? '⚠️' : adv.type === 'danger' ? '🚨' : '✅'}
                </Text>
                <Text className={styles.adviceText}>{adv.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LedgerStatsPage;
