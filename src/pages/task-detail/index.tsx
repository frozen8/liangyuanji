import React, { useState, useEffect } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { TASK_CATEGORY_MAP, TASK_STATUS_MAP, DIFFICULTY_MAP, REALM_LIST, BEAST_STAGE_MAP } from '@/utils/constants';
import { daysUntil, formatDate, relativeDate } from '@/utils/format';
import type { Task, TaskReward } from '@/types/task';
import type { Budget } from '@/types/ledger';
import styles from './index.module.scss';

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false); // 降服弹窗（填实际花费）
  const [showRewardModal, setShowRewardModal] = useState(false); // 降服成功奖励弹窗
  const [actualStones, setActualStones] = useState(''); // 实际花费输入
  const [finalReward, setFinalReward] = useState<TaskReward | null>(null);
  const [stoneRate, setStoneRate] = useState(1);
  const [submitting, setSubmitting] = useState(false); // 防重复提交
  const [breakthroughText, setBreakthroughText] = useState(''); // 境界突破提示

  const taskId = router.params.id || 't1';

  useEffect(() => {
    loadTask();
    loadBudget();
  }, []);

  const loadTask = async () => {
    try {
      setLoading(true);
      const res = await callFunction<{ tasks: Task[] }>('getTasks', { status: 'all' });
      const found = res.tasks.find((t) => t.id === taskId) || res.tasks[0];
      setTask(found || null);
    } catch (err) {
      console.error('[TaskDetail] 加载失败:', err);
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
      console.error('[TaskDetail] 加载预算失败:', err);
    }
  };

  const getUrgency = (deadline: string) => {
    const days = daysUntil(deadline);
    if (days < 0) return { text: '已逾期', color: '#F53F3F', emoji: '⚠️' };
    if (days <= 1) return { text: '危急', color: '#F53F3F', emoji: '🔥' };
    if (days <= 3) return { text: '紧迫', color: '#FF7D00', emoji: '⚡' };
    if (days <= 7) return { text: '临近', color: '#F7B500', emoji: '📅' };
    return { text: '充裕', color: '#00B42A', emoji: '✨' };
  };

  // 实时计算节省/超支与修为
  const actualNum = parseFloat(actualStones) || 0;
  const budgetNum = task?.budgetStones || 0;
  const savedStones = budgetNum - actualNum; // 正=节省，负=超支
  const baseCultivation = task ? task.difficulty * 35 : 0;
  const savedBonus = savedStones > 0 ? Math.floor(savedStones / 100) * 10 : 0;
  const totalCultivation = baseCultivation + savedBonus;
  let moodChange = 0;
  if (actualNum > 0) {
    if (savedStones > 0) {
      moodChange = Math.min(Math.floor((savedStones / 200) * 3), 15);
    } else if (savedStones < 0) {
      moodChange = -Math.min(Math.floor((-savedStones / 200) * 5), 20);
    }
  }

  const handleOpenComplete = () => {
    setActualStones('');
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!task) return;
    if (actualNum <= 0) {
      Taro.showToast({ title: '请填写实际花费', icon: 'none' });
      return;
    }
    if (submitting) return; // 防重复提交
    setSubmitting(true);
    try {
      const res = await callFunction<{
        task: Task;
        reward: TaskReward;
        breakthrough?: any;
        ledger?: any;
        budgetStatus?: any;
      }>('updateTask', {
        taskId: task.id,
        status: 'done',
        actualStones: actualNum
      });
      setTask(res.task);
      setFinalReward(res.reward);
      // 计算突破提示
      if (res.breakthrough) {
        const b = res.breakthrough;
        let text = '';
        if (b.type === 'realm' || b.type === 'both') {
          const toRealm = REALM_LIST.find(r => r.level === b.to);
          if (toRealm) text += `🎊 境界突破：${toRealm.name}！${toRealm.unlocked}`;
        }
        if (b.type === 'stage' || b.type === 'both') {
          const toStage = b.toStage || b.to;
          const stageInfo = BEAST_STAGE_MAP[toStage];
          if (stageInfo) text += `\n${stageInfo.emoji} 灵兽进化：${stageInfo.name}！`;
        }
        setBreakthroughText(text);
      } else {
        setBreakthroughText('');
      }
      setShowCompleteModal(false);
      setShowRewardModal(true);
      setTimeout(() => {
        Taro.navigateBack();
      }, 2800);
    } catch (err) {
      console.error('[TaskDetail] 降服失败:', err);
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    Taro.showModal({
      title: '放弃妖兽',
      content: `确定放弃「${task.title}」？\n放弃后无法恢复`,
      confirmText: '放弃',
      confirmColor: '#F53F3F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await callFunction('deleteTask', { taskId: task.id });
            Taro.showToast({ title: '已放弃', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          } catch (err: any) {
            Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleArchive = () => {
    Taro.showToast({ title: '已归档', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1000);
  };

  if (loading) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>⏳</Text>
          <Text className={styles.loadingText}>妖兽信息加载中...</Text>
        </View>
      </View>
    );
  }

  if (!task) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>👻</Text>
          <Text className={styles.loadingText}>妖兽不存在</Text>
        </View>
      </View>
    );
  }

  const cat = TASK_CATEGORY_MAP[task.category];
  const diff = DIFFICULTY_MAP[task.difficulty];
  const status = TASK_STATUS_MAP[task.status];
  const urgency = getUrgency(task.deadline);
  const isDone = task.status === 'done';
  const isOver = task.savedStones !== undefined && task.savedStones < 0;
  const isSaved = task.savedStones !== undefined && task.savedStones > 0;

  return (
    <View className={styles.detailPage}>
      {/* 妖兽卡片 */}
      <View className={styles.beastCard} style={{ background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}DD 100%)` }}>
        <View className={styles.beastHeader}>
          <Text className={styles.beastEmoji}>{cat.emoji}</Text>
          <View className={styles.beastInfo}>
            <Text className={styles.beastName}>{task.title}</Text>
            <Text className={styles.beastCategory}>{cat.name}</Text>
          </View>
          <Text className={styles.beastDifficulty}>{diff.emoji}</Text>
        </View>
        <View className={styles.beastStatusRow}>
          <Text className={styles.beastStatusTag} style={{ background: 'rgba(255,255,255,0.3)' }}>{status.name}</Text>
          {task.status !== 'done' && (
            <Text className={styles.beastUrgency}>
              {urgency.emoji} {urgency.text} · {relativeDate(task.deadline)}
            </Text>
          )}
        </View>
      </View>

      {/* 任务信息 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📋 任务信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>名称</Text>
            <Text className={styles.infoValue}>{task.title}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>类型</Text>
            <Text className={styles.infoValue}>{cat.emoji} {cat.name}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>难度</Text>
            <Text className={styles.infoValue}>{diff.emoji} {diff.name}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>截止</Text>
            <Text className={styles.infoValue} style={{ color: urgency.color }}>
              {formatDate(task.deadline)}（{relativeDate(task.deadline)}）
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预算灵石</Text>
            <Text className={styles.infoValue}>
              💰 {task.budgetStones} (≈ ¥{(task.budgetStones * stoneRate).toFixed(2)})
              <Text className={styles.budgetLockTip} style={{ marginLeft: '8rpx' }}>🔒 不可改</Text>
            </Text>
          </View>
          {isDone && task.actualStones !== undefined && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>实际花费</Text>
              <Text className={styles.infoValue}>
                💸 {task.actualStones} (≈ ¥{(task.actualStones * stoneRate).toFixed(2)})
                {isSaved && <Text className={`${styles.budgetTag} ${styles.budgetTagSaved}`}>节省 {task.savedStones}</Text>}
                {isOver && <Text className={`${styles.budgetTag} ${styles.budgetTagOver}`}>超支 {-task.savedStones!}</Text>}
              </Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建</Text>
            <Text className={styles.infoValue}>{formatDate(task.createTime)}</Text>
          </View>
          {task.assigneeName && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>接单</Text>
              <Text className={styles.infoValue}>👤 {task.assigneeName}</Text>
            </View>
          )}
          {task.completeTime && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>完成</Text>
              <Text className={styles.infoValue}>✅ {formatDate(task.completeTime, 'MM-DD HH:mm')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 任务备注 */}
      {task.note && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📝 任务备注</Text>
          <Text className={styles.noteContent}>{task.note}</Text>
        </View>
      )}

      {/* 降服奖励 */}
      <View className={styles.rewardCard}>
        <Text className={styles.rewardTitle}>🎁 降服奖励</Text>
        {isDone ? (
          // 已完成：展示最终结算奖励
          <View className={styles.rewardList}>
            <View className={styles.rewardItem}>
              <Text className={styles.rewardEmoji}>✨</Text>
              <Text className={styles.rewardValue}>{task.reward.cultivation}</Text>
              <Text className={styles.rewardLabel}>总修为</Text>
            </View>
            {task.reward.savedBonus > 0 && (
              <View className={styles.rewardItem}>
                <Text className={styles.rewardEmoji}>💎</Text>
                <Text className={styles.rewardValue}>+{task.reward.savedBonus}</Text>
                <Text className={styles.rewardLabel}>节省奖励</Text>
              </View>
            )}
            <View className={styles.rewardItem}>
              <Text className={styles.rewardEmoji}>😊</Text>
              <Text className={styles.rewardValue}>{task.reward.moodBonus >= 0 ? `+${task.reward.moodBonus}` : task.reward.moodBonus}</Text>
              <Text className={styles.rewardLabel}>心情</Text>
            </View>
          </View>
        ) : (
          // 未完成：展示基础修为预估
          <View className={styles.rewardList}>
            <View className={styles.rewardItem}>
              <Text className={styles.rewardEmoji}>✨</Text>
              <Text className={styles.rewardValue}>{baseCultivation}</Text>
              <Text className={styles.rewardLabel}>基础修为</Text>
            </View>
          </View>
        )}
      </View>

      {/* 底部按钮 */}
      {isDone ? (
        // 已完成：仅显示归档按钮，不显示删除（v1.1 确认）
        <View className={styles.bottomBar}>
          <Button className={styles.archiveBtn} onClick={handleArchive}>📦 归档</Button>
        </View>
      ) : (
        <View className={styles.bottomBar}>
          <Button className={styles.deleteBtn} onClick={handleDelete}>🗑️ 放弃</Button>
          <Button className={styles.completeBtn} onClick={handleOpenComplete}>⚔️ 降服</Button>
        </View>
      )}

      {/* 降服弹窗：填写实际花费 */}
      {showCompleteModal && (
        <View className={styles.rewardModal}>
          <View className={styles.completeModalContent}>
            <Text className={styles.completeModalTitle}>🎉 降服「{task.title}」</Text>
            <Text className={styles.completeModalLabel}>预算灵石</Text>
            <Text className={styles.completeModalBudget}>
              💰 {task.budgetStones} 灵石 (≈ ¥{(task.budgetStones * stoneRate).toFixed(2)})
            </Text>
            <Text className={styles.completeModalLabel}>实际花费灵石</Text>
            <View className={styles.completeModalInputWrap}>
              <Input
                className={styles.completeModalInput}
                type="digit"
                placeholder="请输入实际花费"
                value={actualStones}
                onInput={(e) => setActualStones(e.detail.value)}
              />
              {actualNum > 0 && (
                <Text className={styles.completeModalRate}>≈ ¥{(actualNum * stoneRate).toFixed(2)}</Text>
              )}
            </View>
            {actualNum > 0 && (
              <View className={styles.completeModalCalc}>
                <View className={styles.completeModalCalcRow}>
                  <Text className={styles.completeModalCalcLabel}>{savedStones >= 0 ? '节省灵石' : '超支灵石'}</Text>
                  <Text className={`${styles.completeModalCalcValue} ${savedStones >= 0 ? styles.completeModalCalcValueOk : styles.completeModalCalcValueWarn}`}>
                    {savedStones >= 0 ? '+' : ''}{savedStones}
                  </Text>
                </View>
                <View className={styles.completeModalCalcRow}>
                  <Text className={styles.completeModalCalcLabel}>基础修为</Text>
                  <Text className={styles.completeModalCalcValue}>+{baseCultivation}</Text>
                </View>
                {savedBonus > 0 && (
                  <View className={styles.completeModalCalcRow}>
                    <Text className={styles.completeModalCalcLabel}>节省奖励修为</Text>
                    <Text className={`${styles.completeModalCalcValue} ${styles.completeModalCalcValueOk}`}>+{savedBonus}</Text>
                  </View>
                )}
                <View className={styles.completeModalCalcRow}>
                  <Text className={styles.completeModalCalcLabel}>总修为</Text>
                  <Text className={styles.completeModalCalcValue}>+{totalCultivation}</Text>
                </View>
                <View className={styles.completeModalCalcRow}>
                  <Text className={styles.completeModalCalcLabel}>心情变化</Text>
                  <Text className={`${styles.completeModalCalcValue} ${moodChange >= 0 ? styles.completeModalCalcValueOk : styles.completeModalCalcValueWarn}`}>
                    {moodChange >= 0 ? '+' : ''}{moodChange}
                  </Text>
                </View>
              </View>
            )}
            <View className={styles.completeModalActions}>
              <Button className={styles.completeModalCancel} onClick={() => setShowCompleteModal(false)}>取消</Button>
              <Button className={styles.completeModalConfirm} onClick={handleConfirmComplete} disabled={submitting}>{submitting ? '降服中...' : '确认降服'}</Button>
            </View>
          </View>
        </View>
      )}

      {/* 降服成功奖励弹窗 */}
      {showRewardModal && finalReward && (
        <View className={styles.rewardModal}>
          <View className={styles.rewardModalContent}>
            <Text className={styles.rewardModalEmoji}>{cat.emoji}</Text>
            <Text className={styles.rewardModalTitle}>降服成功！</Text>
            <Text className={styles.rewardModalDesc}>已击败「{task.title}」</Text>
            <View className={styles.rewardModalList}>
              <Text className={styles.rewardModalItem}>✨ {finalReward.cultivation} 修为</Text>
              {finalReward.savedBonus > 0 && (
                <Text className={styles.rewardModalItem}>💎 节省奖励 +{finalReward.savedBonus} 修为</Text>
              )}
              <Text className={styles.rewardModalItem}>
                😊 心情 {finalReward.moodBonus >= 0 ? `+${finalReward.moodBonus}` : finalReward.moodBonus}
              </Text>
              <Text className={styles.rewardModalItem}>💸 灵石池 -{task.actualStones}</Text>
              {breakthroughText && (
                <Text className={styles.rewardModalItem}>{breakthroughText}</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TaskDetailPage;
