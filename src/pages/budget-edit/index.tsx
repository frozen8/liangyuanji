import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { useAppStore } from '@/store/useAppStore';
import styles from './index.module.scss';

interface BudgetData {
  budget: {
    coupleId: string;
    totalBudget: number;
    stoneRate: number;
    categoryBudget: Record<string, number>;
    updateTime: string;
  };
  spent: number;
  remain: number;
  remainRmb: number;
  spentRmb: number;
}

const BudgetEditPage: React.FC = () => {
  const { coupleId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [editTotal, setEditTotal] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await callFunction<BudgetData>('getBudget', { coupleId });
      setBudgetData(res);
      setEditTotal(String(res.budget.totalBudget));
    } catch (err) {
      console.error('[BudgetEdit] 加载失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    const num = Number(editTotal);
    if (!Number.isFinite(num) || num <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }
    if (budgetData && num === budgetData.budget.totalBudget) {
      Taro.showToast({ title: '金额未变更', icon: 'none' });
      return;
    }
    setSaving(true);
    try {
      const res = await callFunction<BudgetData>('updateBudget', { coupleId, totalBudget: num });
      setBudgetData(res);
      Taro.showToast({ title: '已更新', icon: 'success' });
    } catch (err) {
      console.error('[BudgetEdit] 更新失败:', err);
      Taro.showToast({ title: '更新失败，请重试', icon: 'none' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !budgetData) {
    return (
      <View className={styles.budgetPage}>
        <Text className={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const { budget, spent, remain, remainRmb, spentRmb } = budgetData;
  const spentPercent = budget.totalBudget > 0 ? Math.round((spent / budget.totalBudget) * 100) : 0;
  const isOverBudget = remain < 0;

  return (
    <View className={styles.budgetPage}>
      {/* 概览卡 */}
      <View className={styles.overviewCard}>
        <Text className={styles.overviewEmoji}>💎</Text>
        <Text className={styles.overviewTitle}>灵石池总览</Text>
        <View className={styles.overviewGrid}>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewLabel}>总预算</Text>
            <Text className={styles.overviewValue}>{budget.totalBudget}</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewLabel}>已花费</Text>
            <Text className={styles.overviewValueSpent}>{spent}</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewLabel}>剩余</Text>
            <Text className={`${styles.overviewValue} ${isOverBudget ? styles.overviewValueWarn : ''}`}>
              {remain}
            </Text>
          </View>
        </View>
        <Text className={styles.overviewTip}>
          已用 {spentPercent}%{isOverBudget ? ' · ⚠️ 超支' : ''} · 剩余 ≈ ¥{remainRmb.toFixed(2)}（已花 ≈ ¥{spentRmb.toFixed(2)}）
        </Text>
      </View>

      {/* 换算比例卡 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>💱 灵石换算比例</Text>
        <View className={styles.rateRow}>
          <Text className={styles.rateValue}>1 灵石 = {budget.stoneRate} 元</Text>
          <Text className={styles.rateLock}>🔒 创建后不可修改</Text>
        </View>
      </View>

      {/* 修改卡 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>✏️ 修改灵石池总额</Text>
        <Input
          className={styles.input}
          type="digit"
          placeholder="请输入新的总预算"
          value={editTotal}
          onInput={(e) => setEditTotal(e.detail.value)}
        />
        <Text className={styles.hint}>修改后立即生效，已花费金额不受影响</Text>
        <Button
          className={styles.saveBtn}
          loading={saving}
          onClick={handleSave}
        >
          💾 确认修改
        </Button>
      </View>
    </View>
  );
};

export default BudgetEditPage;
