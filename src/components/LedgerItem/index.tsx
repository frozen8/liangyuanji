import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { LEDGER_CATEGORY_MAP } from '@/utils/constants';
import { formatDate } from '@/utils/format';
import type { LedgerItem as LedgerItemType } from '@/types/ledger';
import styles from './index.module.scss';

interface LedgerItemProps {
  item: LedgerItemType;
  stoneRate?: number; // 灵石人民币换算比例，默认 1
}

const LedgerItem: React.FC<LedgerItemProps> = ({ item, stoneRate = 1 }) => {
  const category = LEDGER_CATEGORY_MAP[item.category];
  const isTask = item.sourceType === 'task';

  const handleNavigate = () => {
    // [降妖] 标记的流水点击跳转关联任务详情；[独立] 跳转账单详情
    if (isTask && item.taskId) {
      Taro.navigateTo({ url: `/pages/task-detail/index?id=${item.taskId}` });
    } else {
      Taro.navigateTo({ url: `/pages/ledger-detail/index?id=${item.id}` });
    }
  };

  return (
    <View className={styles.ledgerItem} onClick={handleNavigate}>
      <View className={styles.left}>
        <View className={styles.emojiBadge} style={{ background: `${category.color}1A` }}>
          <Text className={styles.emoji}>{category.emoji}</Text>
        </View>
        <View className={styles.body}>
          <Text className={styles.note}>
            {item.note || category.name}
            <Text className={`${styles.sourceTag} ${isTask ? styles.sourceTagTask : styles.sourceTagManual}`}>
              {isTask ? '降妖' : '独立'}
            </Text>
          </Text>
          <View className={styles.meta}>
            <Text className={styles.category}>{category.name}</Text>
            <Text className={styles.dot}>·</Text>
            <Text className={styles.date}>{formatDate(item.date, 'MM-DD')}</Text>
          </View>
          <View className={styles.recorder}>
            {item.recorderAvatar ? (
              <Image className={styles.avatar} src={item.recorderAvatar} mode="aspectFill" />
            ) : (
              <View className={styles.avatarPlaceholder}><Text className={styles.avatarEmoji}>👤</Text></View>
            )}
            <Text className={styles.recorderName}>{item.recorderName || '良人'}</Text>
          </View>
        </View>
      </View>
      <View className={styles.right}>
        <Text className={styles.amount}>-{item.amount} 灵石</Text>
        <Text className={styles.amountRmb}>≈ ¥{(item.amount * stoneRate).toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default LedgerItem;
