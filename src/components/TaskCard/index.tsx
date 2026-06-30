import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { TASK_CATEGORY_MAP, TASK_STATUS_MAP, DIFFICULTY_MAP } from '@/utils/constants';
import { relativeDate } from '@/utils/format';
import type { Task } from '@/types/task';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
  onComplete?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const category = TASK_CATEGORY_MAP[task.category];
  const status = TASK_STATUS_MAP[task.status];
  const difficulty = DIFFICULTY_MAP[task.difficulty] || DIFFICULTY_MAP[1];
  const isOverdue = task.status === 'overdue';
  const isDone = task.status === 'done';

  const handleNavigate = () => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
  };

  return (
    <View
      className={classnames(styles.taskCard, isOverdue && styles.overdue, isDone && styles.done)}
      onClick={handleNavigate}
    >
      <View className={styles.left}>
        <View className={styles.emojiBadge} style={{ background: `${category.color}1A` }}>
          <Text className={styles.emoji}>{category.emoji}</Text>
        </View>
      </View>
      <View className={styles.body}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{task.title}</Text>
          <View className={styles.statusTag} style={{ background: `${status.color}1A`, color: status.color }}>
            <Text className={styles.statusText}>{status.name}</Text>
          </View>
        </View>
        <View className={styles.meta}>
          <Text className={styles.category}>{category.name}</Text>
          <Text className={styles.dot}>·</Text>
          <Text className={styles.difficulty}>{difficulty.emoji}</Text>
          <Text className={styles.dot}>·</Text>
          <Text className={classnames(styles.deadline, isOverdue && styles.deadlineWarn)}>
            {isOverdue ? '已逾期' : relativeDate(task.deadline)}
          </Text>
        </View>
        <View className={styles.rewardRow}>
          <View className={styles.rewardItem}>
            <Text className={styles.rewardEmoji}>✨</Text>
            <Text className={styles.rewardValue}>+{task.reward.cultivation}</Text>
          </View>
          <View className={styles.rewardItem}>
            <Text className={styles.rewardEmoji}>💎</Text>
            <Text className={styles.rewardValue}>{task.budgetStones}</Text>
          </View>
        </View>
        <View className={styles.peopleRow}>
          {task.assigneeName && (
            <Text className={styles.personTag}>📋 发布：{task.assigneeName}</Text>
          )}
          {isDone && task.completerName && (
            <Text className={styles.personTag}>⚔️ 降服：{task.completerName}</Text>
          )}
        </View>
      </View>
      {!isDone && (
        <View
          className={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.(task);
          }}
        >
          <Text className={styles.actionText}>降服</Text>
        </View>
      )}
    </View>
  );
};

export default TaskCard;
