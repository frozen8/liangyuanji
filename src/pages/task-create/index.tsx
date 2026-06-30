import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Button, Picker, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { TASK_CATEGORY_MAP, DIFFICULTY_MAP } from '@/utils/constants';
import type { TaskCategory } from '@/types/task';
import type { Budget } from '@/types/ledger';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const CATEGORIES: TaskCategory[] = ['dress', 'hotel', 'banquet', 'invitation', 'gift', 'shopping', 'other'];

const TaskCreatePage: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('dress');
  const [difficulty, setDifficulty] = useState(1);
  const [deadline, setDeadline] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [note, setNote] = useState('');
  const [budgetStones, setBudgetStones] = useState(''); // 预算灵石（字符串输入）
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
        console.error('[TaskCreate] 加载预算失败:', err);
      }
    })();
  }, []);

  // 奖励计算（仅修为）
  const rewardCultivation = difficulty * 35;
  const budgetNum = parseFloat(budgetStones) || 0;
  const budgetRmb = budgetNum * stoneRate;
  const isOverRemain = budgetRemain !== null && budgetNum > budgetRemain;

  const handleDateChange = (e: any) => {
    setDeadline(e.detail.value);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入妖兽名称', icon: 'none' });
      return;
    }
    if (budgetNum <= 0) {
      Taro.showToast({ title: '请填写预算灵石', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      await callFunction('createTask', {
        title: title.trim(),
        category,
        difficulty,
        deadline,
        note: note.trim(),
        budgetStones: budgetNum
      });
      Taro.showToast({ title: '妖兽已召唤', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('[TaskCreate] 创建失败:', err);
      Taro.showToast({ title: '召唤失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.createPage}>
      <ScrollView scrollY className={styles.scrollContent}>
        {/* 妖兽名称 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>⚔️ 妖兽名称</Text>
          <Input
            className={styles.titleInput}
            placeholder="请输入任务标题..."
            maxlength={30}
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
          />
        </View>

        {/* 妖兽类型 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>🏷️ 妖兽类型</Text>
          <ScrollView scrollX className={styles.categoryScroll}>
            {CATEGORIES.map((key) => {
              const cat = TASK_CATEGORY_MAP[key];
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
        </View>

        {/* 妖兽难度 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>⭐ 妖兽难度</Text>
          <View className={styles.difficultyRow}>
            {[1, 2, 3, 4, 5].map((d) => (
              <View
                key={d}
                className={`${styles.difficultyItem} ${difficulty === d ? styles.difficultyItemActive : ''}`}
                onClick={() => setDifficulty(d)}
              >
                <Text className={styles.difficultyStar}>{'⭐'.repeat(d)}</Text>
                <Text className={styles.difficultyName}>{DIFFICULTY_MAP[d].name}</Text>
                <Text className={styles.difficultyAttack}>攻击力 {DIFFICULTY_MAP[d].attack}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 预算灵石（新增必填） */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>💰 预算灵石（预计花费）</Text>
          <View className={styles.budgetInputWrap}>
            <Input
              className={styles.budgetInput}
              type="digit"
              placeholder="请输入预计花费灵石数"
              value={budgetStones}
              onInput={(e) => setBudgetStones(e.detail.value)}
            />
            {budgetNum > 0 && (
              <Text className={styles.budgetRate}>≈ ¥{budgetRmb.toFixed(2)}</Text>
            )}
          </View>
          {budgetRemain !== null && (
            <Text className={styles.budgetHint}>
              灵石池余额：{budgetRemain} 灵石 (≈ ¥{(budgetRemain * stoneRate).toFixed(2)})
            </Text>
          )}
          {isOverRemain && (
            <Text className={styles.budgetLockTip}>⚠️ 预算超过剩余灵石池，注意控制支出</Text>
          )}
          <Text className={styles.budgetLockTip}>🔒 预算创建后不可修改，请谨慎填写</Text>
        </View>

        {/* 降服期限 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>📅 降服期限</Text>
          <Picker mode="date" value={deadline} start={dayjs().format('YYYY-MM-DD')} end="2027-12-31" onChange={handleDateChange}>
            <View className={styles.pickerValue}>
              <Text className={styles.pickerText}>{deadline}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        {/* 妖兽备注 */}
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>📝 妖兽备注</Text>
          <Textarea
            className={styles.noteInput}
            placeholder="补充说明（可选）..."
            maxlength={200}
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>

        {/* 奖励预览（仅修为） */}
        <View className={styles.rewardCard}>
          <Text className={styles.rewardTitle}>🎁 预估奖励</Text>
          <View className={styles.rewardList}>
            <View className={styles.rewardItem}>
              <Text className={styles.rewardEmoji}>✨</Text>
              <Text className={styles.rewardValue}>{rewardCultivation}</Text>
              <Text className={styles.rewardLabel}>基础修为</Text>
            </View>
          </View>
          <Text className={styles.rewardTip}>
            完成时填写实际花费，节省可获额外修为（每节省100灵石=10修为）
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
          ⚔️ 召唤妖兽
        </Button>
      </View>
    </View>
  );
};

export default TaskCreatePage;
