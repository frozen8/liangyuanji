import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Button, Picker, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { LEDGER_CATEGORY_MAP } from '@/utils/constants';
import type { LedgerCategory } from '@/types/ledger';
import type { Budget } from '@/types/ledger';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const CATEGORIES: LedgerCategory[] = ['dress', 'hotel', 'catering', 'gift', 'decoration', 'other'];

const LedgerCreatePage: React.FC = () => {
  const [amount, setAmount] = useState(''); // 灵石数（字符串输入）
  const [category, setCategory] = useState<LedgerCategory>('other');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [stoneRate, setStoneRate] = useState(1); // 灵石人民币换算比例
  const [budgetRemain, setBudgetRemain] = useState<number | null>(null); // 灵石池余额
  const [loading, setLoading] = useState(false);

  // 加载预算信息（获取 stoneRate 与余额）
  useEffect(() => {
    (async () => {
      try {
        const res = await callFunction<{ budget: Budget; spent?: number }>('getBudget');
        setStoneRate(res.budget.stoneRate || 1);
        const spent = (res as any).spent || 0;
        setBudgetRemain(res.budget.totalBudget - spent);
      } catch (err) {
        console.error('[LedgerCreate] 加载预算失败:', err);
      }
    })();
  }, []);

  const amountNum = parseFloat(amount) || 0;
  const amountRmb = amountNum * stoneRate;
  const isOverRemain = budgetRemain !== null && amountNum > budgetRemain;

  const handleDateChange = (e: any) => {
    setDate(e.detail.value);
  };

  const handleSubmit = async () => {
    if (amountNum <= 0) {
      Taro.showToast({ title: '请填写支出灵石数', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      await callFunction('createLedger', {
        amount: amountNum,
        category,
        note: note.trim(),
        date,
        sourceType: 'manual'
      });
      Taro.showToast({ title: '记账成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('[LedgerCreate] 记账失败:', err);
      Taro.showToast({ title: '记账失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.createPage}>
      <ScrollView scrollY className={styles.scrollContent}>
        {/* 支出灵石 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>💎 支出灵石</Text>
          <View className={styles.amountInputWrap}>
            <Input
              className={styles.amountInput}
              type="digit"
              placeholder="请输入支出灵石数"
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
            {amountNum > 0 && (
              <Text className={styles.amountRate}>≈ ¥{amountRmb.toFixed(2)}</Text>
            )}
          </View>
          {budgetRemain !== null && (
            <Text className={styles.amountHint}>
              灵石池余额：{budgetRemain} 灵石 (≈ ¥{(budgetRemain * stoneRate).toFixed(2)})
            </Text>
          )}
          {isOverRemain && (
            <Text className={styles.amountWarnTip}>⚠️ 本次支出超过剩余灵石池，将出现超支</Text>
          )}
        </View>

        {/* 支出分类 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>🏷️ 支出分类</Text>
          <ScrollView scrollX className={styles.categoryScroll}>
            {CATEGORIES.map((key) => {
              const cat = LEDGER_CATEGORY_MAP[key];
              return (
                <View
                  key={key}
                  className={`${styles.categoryItem} ${category === key ? styles.categoryItemActive : ''}`}
                  onClick={() => setCategory(key)}
                >
                  <Text className={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text className={styles.categoryName}>{cat.name}</Text>
                </View>
              );
            })}
          </ScrollView>
          <Text className={styles.categoryTip}>💡 不确定分类可选「📦 其他」兜底</Text>
        </View>

        {/* 记账日期 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>📅 记账日期</Text>
          <Picker mode="date" value={date} end={dayjs().format('YYYY-MM-DD')} onChange={handleDateChange}>
            <View className={styles.pickerValue}>
              <Text className={styles.pickerText}>{date}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        {/* 备注 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>📝 备注</Text>
          <Textarea
            className={styles.noteInput}
            placeholder="补充说明（可选）..."
            maxlength={200}
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>

        {/* 灵石说明 */}
        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>💎 灵石说明</Text>
          <Text className={styles.tipText}>
            灵石为婚礼预算单位，1 灵石 = ¥{stoneRate}。独立记账直接从灵石池扣除，降妖任务完成时也会自动入账。
          </Text>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className={styles.bottomBar}>
        <Button
          className={styles.submitBtn}
          loading={loading}
          onClick={handleSubmit}
        >
          💎 记一笔
        </Button>
      </View>
    </View>
  );
};

export default LedgerCreatePage;
