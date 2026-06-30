import React from 'react';
import { View, Text } from '@tarojs/components';
import { daysUntil } from '@/utils/format';
import styles from './index.module.scss';

interface CountDownProps {
  date: string;
  label?: string;
}

const CountDown: React.FC<CountDownProps> = ({ date, label = '飞升倒计时' }) => {
  const days = daysUntil(date);
  return (
    <View className={styles.countDown}>
      <Text className={styles.label}>{label}</Text>
      <View className={styles.numberRow}>
        <Text className={styles.number}>{days > 0 ? days : 0}</Text>
        <Text className={styles.unit}>天</Text>
      </View>
    </View>
  );
};

export default CountDown;
