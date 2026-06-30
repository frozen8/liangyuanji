import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { LEDGER_CATEGORY_MAP } from '@/utils/constants';
import { formatDate } from '@/utils/format';
import type { LedgerItem as LedgerItemType, Budget } from '@/types/ledger';
import styles from './index.module.scss';

const LedgerDetailPage: React.FC = () => {
  const router = useRouter();
  const [ledger, setLedger] = useState<LedgerItemType | null>(null);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [stoneRate, setStoneRate] = useState(1);
  const [loading, setLoading] = useState(true);

  const ledgerId = router.params.id || 'l1';

  useEffect(() => {
    loadLedger();
    loadBudget();
  }, []);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const res = await callFunction<{ ledgers: LedgerItemType[]; stats: any }>('getLedgers', {});
      const found = res.ledgers.find((l) => l.id === ledgerId) || res.ledgers[0];
      setLedger(found || null);
      if (found) {
        const catTotal = res.ledgers.filter((l) => l.category === found.category).reduce((s, l) => s + l.amount, 0);
        setCategoryTotal(catTotal);
        setGrandTotal(res.stats.totalSpent);
      }
    } catch (err) {
      console.error('[LedgerDetail] 加载失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const loadBudget = async () => {
    try {
      const res = await callFunction<{ budget: Budget }>('getBudget');
      setStoneRate(res.budget.stoneRate || 1);
    } catch (err) {
      console.error('[LedgerDetail] 加载预算失败:', err);
    }
  };

  const handleDelete = () => {
    if (!ledger) return;
    if (ledger.sourceType === 'task') {
      Taro.showToast({ title: '降妖任务账单不可删除', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '删除账单',
      content: '确定删除这条账单记录吗？',
      confirmText: '删除',
      confirmColor: '#F53F3F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await callFunction('deleteLedger', { ledgerId: ledger.id });
            Taro.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          } catch (err: any) {
            Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleEdit = () => {
    Taro.showToast({ title: '编辑功能开发中', icon: 'none' });
  };

  const handleGotoTask = () => {
    if (ledger?.taskId) {
      Taro.navigateTo({ url: `/pages/task-detail/index?id=${ledger.taskId}` });
    }
  };

  if (loading) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>⏳</Text>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!ledger) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>📭</Text>
          <Text className={styles.loadingText}>账单不存在</Text>
        </View>
      </View>
    );
  }

  const cat = LEDGER_CATEGORY_MAP[ledger.category];
  const categoryPercent = grandTotal > 0 ? Math.round((categoryTotal / grandTotal) * 100) : 0;
  const isTask = ledger.sourceType === 'task';

  return (
    <View className={styles.detailPage}>
      {/* 金额卡片（双显） */}
      <View className={styles.amountCard} style={{ background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}DD 100%)` }}>
        <Text className={styles.amountValue}>-{ledger.amount} 灵石</Text>
        <Text className={styles.amountCategory}>≈ ¥{(ledger.amount * stoneRate).toFixed(2)} · {cat.emoji} {cat.name}</Text>
      </View>

      {/* 账单信息 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📋 账单信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>金额</Text>
            <Text className={styles.infoValue}>{ledger.amount} 灵石 (≈ ¥{(ledger.amount * stoneRate).toFixed(2)})</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>分类</Text>
            <Text className={styles.infoValue}>{cat.emoji} {cat.name}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>来源</Text>
            <Text className={styles.infoValue}>
              {isTask ? '⚔️ 降妖任务自动生成' : '✍️ 独立记账'}
            </Text>
          </View>
          {isTask && ledger.taskTitle && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>关联任务</Text>
              <Text className={styles.infoValue} style={{ color: '#FF6B9D' }} onClick={handleGotoTask}>
                {ledger.taskTitle} ›
              </Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>日期</Text>
            <Text className={styles.infoValue}>{formatDate(ledger.date)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>记账</Text>
            <Text className={styles.infoValue}>👤 {ledger.recorderName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>时间</Text>
            <Text className={styles.infoValue}>{formatDate(ledger.createTime, 'MM-DD HH:mm')}</Text>
          </View>
        </View>
      </View>

      {/* 备注 */}
      {ledger.note && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📝 备注</Text>
          <Text className={styles.noteContent}>{ledger.note}</Text>
        </View>
      )}

      {/* 分类概览 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📊 分类概览</Text>
        <View className={styles.categoryOverview}>
          <View className={styles.categoryRow}>
            <Text className={styles.categoryLabel}>{cat.emoji} {cat.name}类累计</Text>
            <Text className={styles.categoryAmount}>{categoryTotal} 灵石</Text>
          </View>
          <View className={styles.categoryRow}>
            <Text className={styles.categoryLabel}>占总支出</Text>
            <Text className={styles.categoryPercent}>{categoryPercent}%</Text>
          </View>
          <View className={styles.categoryBar}>
            <View className={styles.categoryBarFill} style={{ width: `${categoryPercent}%`, background: cat.color }} />
          </View>
        </View>
      </View>

      {/* 底部按钮：降妖任务账单不可删除 */}
      <View className={styles.bottomBar}>
        {isTask ? (
          <Button className={styles.editBtn} onClick={handleGotoTask}>⚔️ 查看任务</Button>
        ) : (
          <>
            <Button className={styles.deleteBtn} onClick={handleDelete}>🗑️ 删除</Button>
            <Button className={styles.editBtn} onClick={handleEdit}>✏️ 编辑</Button>
          </>
        )}
      </View>
    </View>
  );
};

export default LedgerDetailPage;
