import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import styles from './index.module.scss';

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const AchievementPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await callFunction<{ achievements: Achievement[] }>('getAchievements', {});
      setAchievements(res.achievements);
    } catch (err) {
      console.error('[Achievement] 加载失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const unlockedList = useMemo(() => achievements.filter((a) => a.unlocked), [achievements]);
  const lockedList = useMemo(() => achievements.filter((a) => !a.unlocked), [achievements]);
  const progressPercent = achievements.length > 0 ? Math.round((unlockedList.length / achievements.length) * 100) : 0;

  const selectedAchievement = selectedId ? achievements.find((a) => a.id === selectedId) : null;

  const handleAchievementClick = (a: Achievement) => {
    setSelectedId(a.id);
  };

  const handleCloseModal = () => {
    setSelectedId(null);
  };

  const formatUnlockedDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    return dateStr.slice(5).replace('-', '/');
  };

  if (loading) {
    return (
      <View className={styles.achievementPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>⏳</Text>
          <Text className={styles.loadingText}>成就加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.achievementPage}>
      <ScrollView scrollY className={styles.scrollArea}>
        {/* 进度卡片 */}
        <View className={styles.progressCard}>
          <Text className={styles.progressTitle}>🏆 成就进度 {unlockedList.length}/{achievements.length}</Text>
          <View className={styles.progressBar}>
            <View className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
          </View>
          <Text className={styles.progressPercent}>{progressPercent}%</Text>
          <Text className={styles.progressTip}>
            {progressPercent >= 80 ? '即将飞升，加油！' : progressPercent >= 50 ? '继续努力，飞升在即！' : '姻缘之路刚刚开始，继续加油！'}
          </Text>
        </View>

        {/* 已解锁成就 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>✨ 已解锁成就（{unlockedList.length}）</Text>
          {unlockedList.length > 0 ? (
            <View className={styles.achievementGrid}>
              {unlockedList.map((a) => (
                <View
                  key={a.id}
                  className={styles.achievementItem}
                  onClick={() => handleAchievementClick(a)}
                >
                  <Text className={styles.achievementEmoji}>{a.emoji}</Text>
                  <Text className={styles.achievementName}>{a.name}</Text>
                  <Text className={styles.achievementDate}>{formatUnlockedDate(a.unlockedAt)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className={styles.emptyHint}>暂无已解锁成就</Text>
          )}
        </View>

        {/* 未解锁成就 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>🔒 未解锁成就（{lockedList.length}）</Text>
          {lockedList.length > 0 ? (
            <View className={styles.achievementGrid}>
              {lockedList.map((a) => (
                <View
                  key={a.id}
                  className={`${styles.achievementItem} ${styles.achievementItemLocked}`}
                  onClick={() => handleAchievementClick(a)}
                >
                  <Text className={styles.achievementEmoji}>🔒</Text>
                  <Text className={styles.achievementName}>{a.name}</Text>
                  <Text className={styles.achievementDate}>{a.description}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className={styles.emptyHint}>全部成就已解锁！</Text>
          )}
        </View>
      </ScrollView>

      {/* 成就详情弹窗 */}
      {selectedAchievement && (
        <View className={styles.modalMask} onClick={handleCloseModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalEmoji}>
              {selectedAchievement.unlocked ? selectedAchievement.emoji : '🔒'}
            </Text>
            <Text className={styles.modalName}>{selectedAchievement.name}</Text>
            <View className={`${styles.modalBadge} ${selectedAchievement.unlocked ? styles.modalBadgeUnlocked : styles.modalBadgeLocked}`}>
              <Text>{selectedAchievement.unlocked ? '✅ 已解锁' : '⬜ 未解锁'}</Text>
            </View>
            <Text className={styles.modalDesc}>{selectedAchievement.description}</Text>
            {selectedAchievement.unlocked && selectedAchievement.unlockedAt && (
              <Text className={styles.modalDate}>🏆 解锁时间：{selectedAchievement.unlockedAt}</Text>
            )}
            {!selectedAchievement.unlocked && (
              <Text className={styles.modalHint}>💡 完成对应条件即可解锁</Text>
            )}
            <View className={styles.modalCloseBtn} onClick={handleCloseModal}>
              <Text className={styles.modalCloseText}>关闭</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default AchievementPage;
