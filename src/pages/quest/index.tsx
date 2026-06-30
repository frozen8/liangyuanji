import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { callFunction } from '@/services/cloud';
import { TASK_CATEGORY_MAP } from '@/utils/constants';
import type { Task, TaskCategory } from '@/types/task';
import TaskCard from '@/components/TaskCard';
import Empty from '@/components/Empty';
import { useCoupleGuard } from '@/hooks/useCoupleGuard';
import styles from './index.module.scss';

const CATEGORIES: Array<{ key: 'all' | TaskCategory; name: string; emoji: string }> = [
  { key: 'all', name: '全部', emoji: '🌀' },
  { key: 'dress', name: '婚纱妖', emoji: '👰' },
  { key: 'hotel', name: '酒店妖', emoji: '🏨' },
  { key: 'banquet', name: '喜宴妖', emoji: '🍽️' },
  { key: 'invitation', name: '请柬妖', emoji: '💌' },
  { key: 'gift', name: '礼金妖', emoji: '🧧' },
  { key: 'shopping', name: '采购妖', emoji: '🛍️' },
  { key: 'other', name: '杂事妖', emoji: '👻' }
];

const QuestPage: React.FC = () => {
  useCoupleGuard();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [category, setCategory] = useState<'all' | TaskCategory>('all');
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await callFunction<{ tasks: Task[] }>('getTasks', { category, status: 'all' });
      setTasks(res.tasks);
    } catch (err) {
      console.error('[Quest] 加载任务失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [category]);

  // 页面显示时刷新（从任务创建/详情页返回后自动显示新任务）
  Taro.useDidShow(() => {
    loadTasks();
  });

  Taro.usePullDownRefresh(() => {
    loadTasks().finally(() => Taro.stopPullDownRefresh());
  });

  const handleComplete = (task: Task) => {
    // 重构后降服需填写实际花费，跳转到任务详情页操作
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/task-create/index' });
  };

  const pendingCount = tasks.filter((t) => t.status === 'pending' || t.status === 'doing').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;

  return (
    <View className={styles.questPage}>
      {/* 顶部统计 */}
      <View className={styles.headerCard}>
        <View className={styles.headerItem}>
          <Text className={styles.headerValue}>{pendingCount}</Text>
          <Text className={styles.headerLabel}>待降服</Text>
        </View>
        <View className={styles.headerItem}>
          <Text className={styles.headerValue}>{doneCount}</Text>
          <Text className={styles.headerLabel}>已降服</Text>
        </View>
        <View className={styles.headerItem}>
          <Text className={styles.headerValue}>{overdueCount}</Text>
          <Text className={styles.headerLabel}>已逾期</Text>
        </View>
      </View>

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

      {/* 任务列表 */}
      <View className={styles.taskList}>
        {loading ? (
          <Empty emoji="⏳" text="妖兽集结中..." />
        ) : tasks.length === 0 ? (
          <Empty emoji="🌙" text="此处无妖，可安心修炼" />
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} />
          ))
        )}
      </View>

      {/* 添加按钮 */}
      <View className={styles.fab} onClick={handleAdd}>
        <Text className={styles.fabText}>+</Text>
      </View>
    </View>
  );
};

export default QuestPage;
