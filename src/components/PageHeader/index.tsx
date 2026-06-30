import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, emoji }) => {
  return (
    <View className={styles.pageHeader}>
      <View className={styles.titleRow}>
        {emoji && <Text className={styles.emoji}>{emoji}</Text>}
        <Text className={styles.title}>{title}</Text>
      </View>
      {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

export default PageHeader;
