import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { BEAST_STAGE_MAP } from '@/utils/constants';
import type { BeastStage } from '@/types/beast';
import styles from './index.module.scss';

interface BeastAvatarProps {
  stage: BeastStage;
  size?: number; // rpx
  isLow?: boolean; // 状态过低（灰暗）
  animate?: boolean;
}

// 灵兽展示（Emoji + 光晕，CSS 绘制）
const BeastAvatar: React.FC<BeastAvatarProps> = ({ stage, size = 200, isLow = false, animate = true }) => {
  const info = BEAST_STAGE_MAP[stage] || BEAST_STAGE_MAP.egg;
  return (
    <View
      className={classnames(styles.beastAvatar, isLow && styles.low, animate && styles.animate)}
      style={{ width: `${size}rpx`, height: `${size}rpx` }}
    >
      <View className={styles.halo} />
      <View className={styles.aura} />
      <Text className={styles.emoji} style={{ fontSize: `${size * 0.5}rpx` }}>
        {info.emoji}
      </Text>
    </View>
  );
};

export default BeastAvatar;
