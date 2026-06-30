import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatRingProps {
  value: number; // 0-100
  label: string;
  color: string;
  size?: number; // rpx
}

// 四维状态环形图（CSS conic-gradient 实现）
const StatRing: React.FC<StatRingProps> = ({ value, label, color, size = 96 }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View className={styles.statRing} style={{ width: `${size}rpx`, height: `${size}rpx` }}>
      <View
        className={styles.ring}
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, #F0E4EA 0deg)`,
          width: `${size}rpx`,
          height: `${size}rpx`
        }}
      >
        <View className={styles.inner}>
          <Text className={styles.value}>{clamped}</Text>
        </View>
      </View>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default StatRing;
