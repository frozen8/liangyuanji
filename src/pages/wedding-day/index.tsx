import React, { useState } from 'react';
import { View, Text, Picker, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { useAppStore } from '@/store/useAppStore';
import { daysUntil, formatDate } from '@/utils/format';
import { REALM_LIST } from '@/utils/constants';
import styles from './index.module.scss';

const MILESTONES = [
  { date: '2026-06-01', name: '姻缘初结', emoji: '💞' },
  { date: '2026-06-15', name: '灵兽孵化', emoji: '🐣' },
  { date: '2026-07-01', name: '练气境', emoji: '🌀' },
  { date: '2026-08-01', name: '筑基境', emoji: '🏛️' },
  { date: '2026-10-01', name: '飞升登仙', emoji: '👰' }
];

const WeddingDayPage: React.FC = () => {
  const { weddingDate, setWeddingDate, coupleId } = useAppStore();
  const [editDate, setEditDate] = useState(weddingDate);
  const [loading, setLoading] = useState(false);

  const countdown = daysUntil(weddingDate);
  const today = formatDate(new Date().toISOString());

  const handleDateChange = (e: any) => {
    setEditDate(e.detail.value);
  };

  const handleSave = async () => {
    if (editDate === weddingDate) {
      Taro.showToast({ title: '日期未变更', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      await callFunction('updateWeddingDate', { coupleId, weddingDate: editDate });
      setWeddingDate(editDate);
      Taro.showToast({ title: '飞升日已更新', icon: 'success' });
    } catch (err) {
      console.error('[WeddingDay] 更新失败:', err);
      Taro.showToast({ title: '更新失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.weddingPage}>
      {/* 倒计时卡片 */}
      <View className={styles.countdownCard}>
        <Text className={styles.countdownEmoji}>💒</Text>
        <Text className={styles.countdownLabel}>飞升倒计时</Text>
        <Text className={styles.countdownNumber}>{countdown}</Text>
        <Text className={styles.countdownUnit}>天</Text>
        <Text className={styles.countdownDate}>{formatDate(weddingDate, 'YYYY年MM月DD日')}</Text>
      </View>

      {/* 修改日期 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📅 修改飞升日</Text>
        <Picker mode="date" value={editDate} start="2026-01-01" end="2027-12-31" onChange={handleDateChange}>
          <View className={styles.pickerValue}>
            <Text className={styles.pickerText}>{editDate}</Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </Picker>
        <Button
          className={styles.saveBtn}
          loading={loading}
          onClick={handleSave}
        >
          💒 确认修改
        </Button>
      </View>

      {/* 飞升预告 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>✨ 飞升预告</Text>
        <Text className={styles.previewDesc}>婚礼当日将解锁：</Text>
        <View className={styles.previewList}>
          <View className={styles.previewItem}>
            <Text className={styles.previewEmoji}>👰</Text>
            <Text className={styles.previewText}>飞升典礼场景</Text>
          </View>
          <View className={styles.previewItem}>
            <Text className={styles.previewEmoji}>🏆</Text>
            <Text className={styles.previewText}>备婚历程回顾</Text>
          </View>
          <View className={styles.previewItem}>
            <Text className={styles.previewEmoji}>💝</Text>
            <Text className={styles.previewText}>姻缘灵兽最终形态</Text>
          </View>
          <View className={styles.previewItem}>
            <Text className={styles.previewEmoji}>📸</Text>
            <Text className={styles.previewText}>修炼记忆相册</Text>
          </View>
        </View>
      </View>

      {/* 修炼里程碑 */}
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📜 修炼里程碑</Text>
        <View className={styles.timeline}>
          {MILESTONES.map((m, idx) => {
            const reached = daysUntil(m.date) <= 0;
            const isLast = idx === MILESTONES.length - 1;
            return (
              <View className={styles.timelineItem} key={m.date}>
                <View className={styles.timelineLeft}>
                  <Text className={`${styles.timelineDot} ${reached ? styles.timelineDotActive : ''}`}>
                    {reached ? '✅' : '⬜'}
                  </Text>
                  {!isLast && <Text className={`${styles.timelineLine} ${reached ? styles.timelineLineActive : ''}`} />}
                </View>
                <View className={styles.timelineContent}>
                  <Text className={styles.timelineEmoji}>{m.emoji}</Text>
                  <Text className={styles.timelineName}>{m.name}</Text>
                  <Text className={styles.timelineDate}>{formatDate(m.date, 'YYYY-MM-DD')}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default WeddingDayPage;
