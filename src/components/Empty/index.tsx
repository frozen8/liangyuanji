import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyProps {
  emoji?: string;
  text?: string;
}

const Empty: React.FC<EmptyProps> = ({ emoji = '🌙', text = '暂无数据' }) => {
  return (
    <View className={styles.empty}>
      <Text className={styles.emoji}>{emoji}</Text>
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default Empty;
