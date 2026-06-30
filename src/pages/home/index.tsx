import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { useAppStore } from '@/store/useAppStore';
import { REALM_LIST, BEAST_STAGE_MAP } from '@/utils/constants';
import { daysUntil, formatDate } from '@/utils/format';
import type { Beast } from '@/types/beast';
import type { Task } from '@/types/task';
import type { CultivateTodayStats } from '@/types/cultivate';
import BeastAvatar from '@/components/BeastAvatar';
import StatRing from '@/components/StatRing';
import TaskCard from '@/components/TaskCard';
import CountDown from '@/components/CountDown';
import Empty from '@/components/Empty';
import { useCoupleGuard } from '@/hooks/useCoupleGuard';
import styles from './index.module.scss';

interface HomeStats {
  todayTasks: Task[];
  todayCultivate: CultivateTodayStats;
  coupleMembers: Array<{ openid: string; nickname: string; avatar: string; isSelf: boolean }>;
  weddingDate: string;
  spirit: number; // 灵石池余额
  budgetStatus: {
    total: number;
    spent: number;
    remain: number;
    spentPercent: number;
    isOverBudget: boolean;
    stoneRate: number;
    remainRmb: number;
    spentRmb: number;
  };
}

const HomePage: React.FC = () => {
  useCoupleGuard();
  const [beast, setBeast] = useState<Beast | null>(null);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeding, setFeeding] = useState(false);
  const [feedAnim, setFeedAnim] = useState(false);
  const { setBeast: setStoreBeast, setWeddingDate, setSpirit, coupleId } = useAppStore();

  const loadData = async () => {
    try {
      setLoading(true);
      const [beastRes, statsRes] = await Promise.all([
        callFunction<{ beast: Beast }>('getBeast', { coupleId }),
        callFunction<{ summary: HomeStats }>('getStats', { type: 'home', coupleId })
      ]);
      setBeast(beastRes.beast);
      setStoreBeast(beastRes.beast);
      setStats(statsRes.summary);
      setWeddingDate(statsRes.summary.weddingDate);
      setSpirit(statsRes.summary.spirit);
    } catch (err) {
      console.error('[Home] 加载数据失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 页面显示时刷新数据（从修炼页返回时自动更新境界和灵兽形态）
  Taro.useDidShow(() => {
    loadData();
  });

  // 下拉刷新
  Taro.usePullDownRefresh(() => {
    loadData().finally(() => Taro.stopPullDownRefresh());
  });

  if (loading || !beast || !stats) {
    return (
      <View className={styles.homePage}>
        <View style={{ padding: '200rpx 0', textAlign: 'center' }}>
          <Text style={{ color: '#A89AAC' }}>良缘加载中...</Text>
        </View>
      </View>
    );
  }

  // 境界信息
  const realmIndex = REALM_LIST.findIndex((r) => r.level === beast.realm);
  const currentRealm = REALM_LIST[realmIndex];
  const nextRealm = REALM_LIST[realmIndex + 1];
  const progress = nextRealm
    ? Math.round(((beast.cultivation - currentRealm.minCultivation) / (currentRealm.maxCultivation - currentRealm.minCultivation)) * 100)
    : 100;
  const remainToNext = nextRealm ? nextRealm.minCultivation - beast.cultivation : 0;

  // 灵兽状态是否过低
  const avgStats =
    (beast.stats.satiety + beast.stats.mood + beast.stats.spirit + beast.stats.affinity) / 4;
  const isLow = avgStats < 30;

  const stageInfo = BEAST_STAGE_MAP[beast.stage];

  // 完成任务：跳转到任务详情页填写实际花费（重构后降服需填写实际花费）
  const handleComplete = (task: Task) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
  };

  const goTo = (url: string) => Taro.navigateTo({ url });
  const switchTab = (url: string) => Taro.switchTab({ url });

  // 番茄投喂灵兽
  const handleFeed = async () => {
    if (feeding) return;
    const tomatoCount = (beast as any).tomatoCount || 0;
    if (tomatoCount <= 0) {
      Taro.showToast({ title: '番茄不足，去修炼获取', icon: 'none' });
      return;
    }
    setFeeding(true);
    try {
      const res = await callFunction<{ beast: Beast; gained: { satiety: number; mood: number } }>('feedBeast', { coupleId });
      setBeast(res.beast);
      setStoreBeast(res.beast);
      // 触发投喂动画
      setFeedAnim(true);
      setTimeout(() => setFeedAnim(false), 1500);
      Taro.showToast({
        title: `🍅 投喂成功！饱食度 +${res.gained.satiety} 心情 +${res.gained.mood}`,
        icon: 'none'
      });
    } catch (err: any) {
      console.error('[Home] 投喂失败:', err);
      Taro.showToast({ title: err.message || '投喂失败', icon: 'none' });
    } finally {
      setFeeding(false);
    }
  };

  return (
    <View className={styles.homePage}>
      {/* 飞升倒计时 */}
      <View className={styles.banner}>
        <View className={styles.bannerLeft}>
          <Text className={styles.bannerTitle}>飞升之日</Text>
          <Text className={styles.bannerDate}>{formatDate(stats.weddingDate, 'YYYY年MM月DD日')}</Text>
        </View>
        <CountDown date={stats.weddingDate} />
      </View>

      {/* 灵兽展示 */}
      <View className={`${styles.beastSection} ${feedAnim ? styles.beastBounce : ''}`}>
        {feedAnim && (
          <>
            <Text className={`${styles.feedParticle} ${styles.feedParticle1}`}>🍅</Text>
            <Text className={`${styles.feedParticle} ${styles.feedParticle2}`}>🍅</Text>
            <Text className={`${styles.feedParticle} ${styles.feedParticle3}`}>🍅</Text>
            <Text className={styles.feedHeart}>💖</Text>
          </>
        )}
        <BeastAvatar stage={beast.stage} size={240} isLow={isLow} />
        <Text className={styles.beastName}>{beast.name} · {stageInfo.name}</Text>
        <View className={styles.realmBadge}>
          <Text className={styles.realmText}>☯ {currentRealm.name} · Lv.{beast.level}</Text>
        </View>
      </View>

      {/* 修为进度 */}
      <View className={styles.cultivationCard}>
        <View className={styles.cultivationHeader}>
          <Text className={styles.cultivationLabel}>双修修为</Text>
          <Text className={styles.cultivationValue}>{beast.cultivation} ✨</Text>
        </View>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${progress}%` }} />
        </View>
        <View className={styles.progressMeta}>
          <Text className={styles.progressTip}>{currentRealm.description}</Text>
          {nextRealm && (
            <Text className={styles.progressTip}>距 {nextRealm.name} 还差 {remainToNext} 修为</Text>
          )}
        </View>
      </View>

      {/* 四维状态 */}
      <View className={styles.statsRow}>
        <StatRing value={beast.stats.satiety} label="饱食" color="#FF6B9D" size={104} />
        <StatRing value={beast.stats.mood} label="心情" color="#F7B500" size={104} />
        <StatRing value={beast.stats.spirit} label="灵力" color="#3DAA9A" size={104} />
        <StatRing value={beast.stats.affinity} label="好感" color="#C779D0" size={104} />
      </View>

      {/* 番茄投喂 */}
      <View className={styles.feedCard}>
        <View className={styles.feedInfo}>
          <Text className={styles.feedEmoji}>🍅</Text>
          <View className={styles.feedTextWrap}>
            <Text className={styles.feedTitle}>番茄投喂</Text>
            <Text className={styles.feedDesc}>消耗 1 番茄，饱食度 +20 心情 +10</Text>
          </View>
          <Text className={styles.feedStock}>库存 {((beast as any).tomatoCount || 0)}</Text>
        </View>
        <View
          className={`${styles.feedBtn} ${feeding || ((beast as any).tomatoCount || 0) <= 0 ? styles.feedBtnDisabled : ''}`}
          onClick={feeding || ((beast as any).tomatoCount || 0) <= 0 ? undefined : handleFeed}
        >
          <Text className={styles.feedBtnText}>{feeding ? '投喂中...' : '投喂'}</Text>
        </View>
      </View>

      {/* 双人 */}
      <View className={styles.coupleRow}>
        {stats.coupleMembers[0] && (
          <View className={styles.coupleCol} key={stats.coupleMembers[0].openid}>
            <Image className={styles.coupleAvatar} src={stats.coupleMembers[0].avatar} mode="aspectFill" />
            <Text className={styles.coupleName}>{stats.coupleMembers[0].nickname}</Text>
          </View>
        )}
        <Text className={styles.heart}>💞</Text>
        {stats.coupleMembers[1] && (
          <View className={styles.coupleCol} key={stats.coupleMembers[1].openid}>
            <Image className={styles.coupleAvatar} src={stats.coupleMembers[1].avatar} mode="aspectFill" />
            <Text className={styles.coupleName}>{stats.coupleMembers[1].nickname}</Text>
          </View>
        )}
      </View>

      {/* 今日待办 */}
      <View className={styles.sectionTitle}>
        <Text className={styles.sectionTitleText}>今日降妖</Text>
        <Text className={styles.sectionMore} onClick={() => switchTab('/pages/quest/index')}>查看全部 ›</Text>
      </View>
      <View className={styles.taskList}>
        {stats.todayTasks.length === 0 ? (
          <Empty emoji="🌙" text="今日无降妖任务，可安心修炼" />
        ) : (
          stats.todayTasks.slice(0, 3).map((task) => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} />
          ))
        )}
      </View>

      {/* 今日速览 */}
      <View className={styles.todayRow}>
        <View className={styles.todayCard}>
          <Text className={styles.todayLabel}>🧘 今日修炼</Text>
          <Text className={styles.todayValue}>{stats.todayCultivate.totalMinutes}min</Text>
          <Text className={styles.todaySub}>{stats.todayCultivate.completedCount} 番茄 · +{stats.todayCultivate.totalCultivation} 修为</Text>
        </View>
        <View className={styles.todayCard} onClick={() => switchTab('/pages/ledger/index')}>
          <Text className={styles.todayLabel}>💎 灵石池</Text>
          <Text className={styles.todayValue}>{stats.spirit}</Text>
          <Text className={styles.todaySub}>≈ ¥{stats.budgetStatus.remainRmb.toFixed(2)} · 已用 {stats.budgetStatus.spentPercent}%</Text>
        </View>
      </View>

      {/* 快速入口 */}
      <View className={styles.quickRow}>
        <View className={`${styles.quickBtn} ${styles.quickQuest}`} onClick={() => switchTab('/pages/quest/index')}>
          <Text className={styles.quickText}>⚔️ 降妖</Text>
        </View>
        <View className={`${styles.quickBtn} ${styles.quickLedger}`} onClick={() => switchTab('/pages/ledger/index')}>
          <Text className={styles.quickText}>💎 记账</Text>
        </View>
        <View className={`${styles.quickBtn} ${styles.quickCultivate}`} onClick={() => switchTab('/pages/cultivate/index')}>
          <Text className={styles.quickText}>🧘 修炼</Text>
        </View>
      </View>
    </View>
  );
};

export default HomePage;
