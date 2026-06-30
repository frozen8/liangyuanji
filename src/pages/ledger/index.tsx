import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { callFunction } from '@/services/cloud';
import { LEDGER_CATEGORY_MAP } from '@/utils/constants';
import type { LedgerItem as LedgerItemType, CategoryStat, Budget } from '@/types/ledger';
import LedgerItemComponent from '@/components/LedgerItem';
import Empty from '@/components/Empty';
import { useCoupleGuard } from '@/hooks/useCoupleGuard';
import styles from './index.module.scss';

const CATEGORIES: Array<{ key: 'all' | keyof typeof LEDGER_CATEGORY_MAP; name: string; emoji: string }> = [
  { key: 'all', name: '全部', emoji: '💎' },
  { key: 'dress', name: '婚纱', emoji: '👰' },
  { key: 'hotel', name: '酒店', emoji: '🏨' },
  { key: 'catering', name: '餐饮', emoji: '🍽️' },
  { key: 'gift', name: '礼金', emoji: '🧧' },
  { key: 'decoration', name: '装饰', emoji: '🎀' },
  { key: 'other', name: '其他', emoji: '📦' }
];

interface LedgerStats {
  totalSpent: number;
  categoryStats: CategoryStat[];
  recorderStats: Array<{ openid: string; name: string; avatar: string; amount: number }>;
  sourceStats: { taskAmount: number; manualAmount: number; taskCount: number; manualCount: number };
}

const LedgerPage: React.FC = () => {
  useCoupleGuard();
  const [ledgers, setLedgers] = useState<LedgerItemType[]>([]);
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState<'all' | keyof typeof LEDGER_CATEGORY_MAP>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgerRes, budgetRes] = await Promise.all([
        callFunction<{ ledgers: LedgerItemType[]; stats: LedgerStats }>('getLedgers', { category }),
        callFunction<{ budget: Budget }>('getBudget')
      ]);
      setLedgers(ledgerRes.ledgers);
      setStats(ledgerRes.stats);
      setBudget(budgetRes.budget);
    } catch (err) {
      console.error('[Ledger] 加载数据失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  // 页面显示时刷新（从记账页返回后自动显示新账单）
  Taro.useDidShow(() => {
    loadData();
  });

  Taro.usePullDownRefresh(() => {
    loadData().finally(() => Taro.stopPullDownRefresh());
  });

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/ledger-create/index' });
  };

  const stoneRate = budget?.stoneRate || 1;
  const totalSpent = stats?.totalSpent || 0;
  const totalBudget = budget?.totalBudget || 1;
  const remain = totalBudget - totalSpent;
  const spentPercent = Math.min(100, Math.round((totalSpent / totalBudget) * 100));
  const isOver = remain < 0;

  return (
    <View className={styles.ledgerPage}>
      {/* 预算总览（金额双显） */}
      <View className={styles.budgetCard}>
        <View className={styles.budgetRow}>
          <Text className={styles.budgetLabel}>灵石池结余</Text>
          <Text className={styles.budgetTotal}>{Math.abs(remain)} 灵石</Text>
        </View>
        <Text className={styles.budgetRmb}>≈ ¥{Math.abs(remain * stoneRate).toFixed(2)}</Text>
        <View className={styles.budgetProgress}>
          <View className={styles.budgetFill} style={{ width: `${spentPercent}%` }} />
        </View>
        <View className={styles.budgetSubRow}>
          <Text>已花 {totalSpent} (≈¥{(totalSpent * stoneRate).toFixed(2)})</Text>
          <Text>预算 {totalBudget}</Text>
        </View>
        {isOver && (
          <View style={{ marginTop: '12rpx' }}>
            <Text style={{ fontSize: '22rpx', opacity: 0.9 }}>⚠️ 已超支，灵兽心情将受影响</Text>
          </View>
        )}
      </View>

      {/* 来源占比统计（降妖 vs 独立） */}
      {stats && stats.sourceStats && (stats.sourceStats.taskAmount > 0 || stats.sourceStats.manualAmount > 0) && (
        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>📊 支出来源</Text>
          <View className={styles.statBar}>
            <View className={styles.statBarHeader}>
              <Text className={styles.statBarLabel}>⚔️ 降妖支出</Text>
              <Text className={styles.statBarValue}>{stats.sourceStats.taskAmount} 灵石 · {stats.sourceStats.taskCount} 笔</Text>
            </View>
            <View className={styles.statBarTrack}>
              <View
                className={styles.statBarFill}
                style={{ width: `${totalSpent > 0 ? Math.round((stats.sourceStats.taskAmount / totalSpent) * 100) : 0}%`, background: '#FF6B9D' }}
              />
            </View>
          </View>
          <View className={styles.statBar}>
            <View className={styles.statBarHeader}>
              <Text className={styles.statBarLabel}>✍️ 独立记账</Text>
              <Text className={styles.statBarValue}>{stats.sourceStats.manualAmount} 灵石 · {stats.sourceStats.manualCount} 笔</Text>
            </View>
            <View className={styles.statBarTrack}>
              <View
                className={styles.statBarFill}
                style={{ width: `${totalSpent > 0 ? Math.round((stats.sourceStats.manualAmount / totalSpent) * 100) : 0}%`, background: '#A89AAC' }}
              />
            </View>
          </View>
        </View>
      )}

      {/* 分类统计 */}
      {stats && stats.categoryStats.length > 0 && (
        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>支出分类</Text>
          {stats.categoryStats.map((cs) => {
            const cat = LEDGER_CATEGORY_MAP[cs.category];
            const maxAmount = stats.categoryStats[0].amount;
            const widthPercent = maxAmount > 0 ? Math.round((cs.amount / maxAmount) * 100) : 0;
            return (
              <View className={styles.statBar} key={cs.category}>
                <View className={styles.statBarHeader}>
                  <Text className={styles.statBarLabel}>{cat.emoji} {cat.name}</Text>
                  <Text className={styles.statBarValue}>{cs.amount} 灵石 · {cs.percent}%</Text>
                </View>
                <View className={styles.statBarTrack}>
                  <View
                    className={styles.statBarFill}
                    style={{ width: `${widthPercent}%`, background: cat.color }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 双人排行 */}
      {stats && stats.recorderStats.length > 0 && (
        <View className={styles.recorderRow}>
          {stats.recorderStats[0] && (
            <View className={styles.recorderCol} key={stats.recorderStats[0].openid}>
              <Image className={styles.recorderAvatar} src={stats.recorderStats[0].avatar} mode="aspectFill" />
              <Text className={styles.recorderName}>{stats.recorderStats[0].name} 🏆</Text>
              <Text className={styles.recorderAmount}>{stats.recorderStats[0].amount} 灵石</Text>
            </View>
          )}
          <Text className={styles.recorderVs}>VS</Text>
          {stats.recorderStats[1] && (
            <View className={styles.recorderCol} key={stats.recorderStats[1].openid}>
              <Image className={styles.recorderAvatar} src={stats.recorderStats[1].avatar} mode="aspectFill" />
              <Text className={styles.recorderName}>{stats.recorderStats[1].name}</Text>
              <Text className={styles.recorderAmount}>{stats.recorderStats[1].amount} 灵石</Text>
            </View>
          )}
        </View>
      )}

      {/* 分类筛选 */}
      <View className={styles.filterBar}>
        <ScrollView scrollX className={styles.categoryScroll}>
          {CATEGORIES.map((c) => (
            <View
              key={c.key}
              className={classnames(styles.categoryItem, category === c.key && styles.categoryItemActive)}
              onClick={() => setCategory(c.key)}
            >
              <Text className={styles.categoryEmoji}>{c.emoji}</Text>
              <Text className={classnames(styles.categoryText, category === c.key && styles.categoryTextActive)}>{c.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 流水列表 */}
      <View className={styles.listSection}>
        <Text className={styles.listSectionTitle}>账单流水 · {ledgers.length} 笔</Text>
        {loading ? (
          <Empty emoji="⏳" text="账单汇集中..." />
        ) : ledgers.length === 0 ? (
          <Empty emoji="💎" text="暂无账单" />
        ) : (
          ledgers.map((item) => <LedgerItemComponent key={item.id} item={item} stoneRate={stoneRate} />)
        )}
      </View>

      {/* 记一笔 */}
      <View className={styles.fab} onClick={handleAdd}>
        <Text className={styles.fabText}>+</Text>
      </View>
    </View>
  );
};

export default LedgerPage;
