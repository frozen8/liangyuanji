import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const TAB_LIST = [
  { pagePath: '/pages/home/index', text: '灵兽窝', emoji: '🐾' },
  { pagePath: '/pages/quest/index', text: '降妖录', emoji: '⚔️' },
  { pagePath: '/pages/ledger/index', text: '灵石簿', emoji: '💎' },
  { pagePath: '/pages/cultivate/index', text: '修炼阁', emoji: '🧘' },
  { pagePath: '/pages/mine/index', text: '仙府', emoji: '🏯' }
];

const CustomTabBar: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const [bouncing, setBouncing] = useState<number | null>(null);
  const selectedRef = useRef(0);

  // 定时轮询当前路由，校正选中项（不依赖 useDidShow，避免组件级钩子不可靠）
  useEffect(() => {
    const syncSelected = () => {
      const pages = Taro.getCurrentPages();
      const route = pages[pages.length - 1]?.route || '';
      const index = TAB_LIST.findIndex(tab => tab.pagePath === `/${route}`);
      if (index >= 0 && index !== selectedRef.current) {
        selectedRef.current = index;
        setSelected(index);
      }
    };
    syncSelected();
    const timer = setInterval(syncSelected, 300);
    return () => clearInterval(timer);
  }, []);

  const handleSwitch = (index: number, pagePath: string) => {
    if (index === selectedRef.current) return;
    selectedRef.current = index;
    setBouncing(index);
    setTimeout(() => setBouncing(null), 300);
    setSelected(index);
    Taro.switchTab({ url: pagePath });
  };

  return (
    <View className={styles.tabBar}>
      {TAB_LIST.map((tab, index) => {
        const isActive = index === selected;
        const isBouncing = index === bouncing;
        return (
          <View
            key={tab.pagePath}
            className={`${styles.tabItem} ${isActive ? styles.active : ''} ${isBouncing ? styles.bouncing : ''}`}
            onClick={() => handleSwitch(index, tab.pagePath)}
          >
            <View className={styles.iconWrap}>
              <Text className={styles.icon}>{tab.emoji}</Text>
              {isActive && <View className={styles.indicator} />}
            </View>
            <Text className={`${styles.label} ${isActive ? styles.labelActive : ''}`}>{tab.text}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
