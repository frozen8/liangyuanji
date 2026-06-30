import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { useAppStore } from '@/store/useAppStore';
import { BEAST_STAGE_MAP, REALM_LIST } from '@/utils/constants';
import type { Beast, BeastStage } from '@/types/beast';
import styles from './index.module.scss';

const STAGE_REALM_REQUIRE: Record<BeastStage, { realm: string; realmName: string; description: string }> = {
  egg: { realm: 'mortal', realmName: '凡人', description: '初始形态，姻缘初结时获得' },
  baby: { realm: 'qiRefining', realmName: '练气', description: '姻缘初凝，灵兽破壳而出' },
  adult: { realm: 'goldenCore', realmName: '金丹', description: '金丹大成，灵兽化为成兽' },
  divine: { realm: 'spiritSevering', realmName: '化神', description: '化神入境，灵兽化为神兽' }
};

const STAGE_ORDER: BeastStage[] = ['egg', 'baby', 'adult', 'divine'];

const DECORATIONS = [
  { id: 'd1', emoji: '🎀', name: '蝴蝶结', unlocked: true },
  { id: 'd2', emoji: '👑', name: '小皇冠', unlocked: true },
  { id: 'd3', emoji: '💎', name: '宝石项链', unlocked: true },
  { id: 'd4', emoji: '🌸', name: '樱花环', unlocked: false },
  { id: 'd5', emoji: '🦋', name: '蝶翼', unlocked: false },
  { id: 'd6', emoji: '⭐', name: '星辉冠', unlocked: false },
  { id: 'd7', emoji: '🌈', name: '彩虹尾', unlocked: false },
  { id: 'd8', emoji: '🔥', name: '烈焰角', unlocked: false }
];

const BeastPediaPage: React.FC = () => {
  const [beast, setBeast] = useState<Beast | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<BeastStage | null>(null);
  const { coupleId } = useAppStore();

  useEffect(() => {
    loadBeast();
  }, []);

  const loadBeast = async () => {
    try {
      setLoading(true);
      const res = await callFunction<{ beast: Beast }>('getBeast', { coupleId });
      setBeast(res.beast);
    } catch (err) {
      console.error('[BeastPedia] 加载失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const stageStatus = useMemo(() => {
    if (!beast) return [];
    const currentStageIdx = STAGE_ORDER.indexOf(beast.stage);

    return STAGE_ORDER.map((stage, idx) => {
      const require = STAGE_REALM_REQUIRE[stage];
      const requireRealmIdx = REALM_LIST.findIndex((r) => r.level === require.realm);
      const isUnlocked = idx <= currentStageIdx;
      const isCurrent = stage === beast.stage;
      const requireRealm = REALM_LIST[requireRealmIdx];
      const needCultivation = isUnlocked ? 0 : Math.max(0, requireRealm.minCultivation - beast.cultivation);
      return { stage, isUnlocked, isCurrent, require, needCultivation };
    });
  }, [beast]);

  const isDecorationUnlocked = useMemo(() => {
    if (!beast) return false;
    const realmIdx = REALM_LIST.findIndex((r) => r.level === beast.realm);
    return realmIdx >= 2;
  }, [beast]);

  const collectedDecorations = DECORATIONS.filter((d) => d.unlocked).length;

  const handleToggleStage = (stage: BeastStage) => {
    setExpandedStage(expandedStage === stage ? null : stage);
  };

  if (loading) {
    return (
      <View className={styles.pediaPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>⏳</Text>
          <Text className={styles.loadingText}>图鉴加载中...</Text>
        </View>
      </View>
    );
  }

  if (!beast) {
    return (
      <View className={styles.pediaPage}>
        <View className={styles.loading}>
          <Text className={styles.loadingEmoji}>🥚</Text>
          <Text className={styles.loadingText}>灵兽尚未孵化</Text>
        </View>
      </View>
    );
  }

  const currentStageInfo = BEAST_STAGE_MAP[beast.stage];
  const currentRealm = REALM_LIST.find((r) => r.level === beast.realm);

  return (
    <View className={styles.pediaPage}>
      <ScrollView scrollY className={styles.scrollArea}>
        <View className={styles.currentCard}>
          <View className={styles.currentEmojiWrap}>
            <Text className={styles.currentEmoji}>{currentStageInfo.emoji}</Text>
          </View>
          <Text className={styles.currentName}>{beast.name} · {currentStageInfo.name}</Text>
          <Text className={styles.currentRealm}>☯ {currentRealm?.name}境 · Lv.{beast.level}</Text>
          <View className={styles.cultivationBar}>
            <View
              className={styles.cultivationBarFill}
              style={{ width: `${Math.min(((beast.cultivation - (currentRealm?.minCultivation || 0)) / ((currentRealm?.maxCultivation || 1) - (currentRealm?.minCultivation || 0))) * 100, 100)}%` }}
            />
          </View>
          <Text className={styles.cultivationText}>修为 {beast.cultivation} / {currentRealm?.maxCultivation}</Text>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📖 形态进化图鉴</Text>
          <View className={styles.stageList}>
            {stageStatus.map((s) => {
              const info = BEAST_STAGE_MAP[s.stage];
              const isExpanded = expandedStage === s.stage;
              return (
                <View
                  key={s.stage}
                  className={`${styles.stageCard} ${!s.isUnlocked ? styles.stageCardLocked : ''} ${s.isCurrent ? styles.stageCardCurrent : ''}`}
                  onClick={() => s.isUnlocked && handleToggleStage(s.stage)}
                >
                  <View className={styles.stageHeader}>
                    <Text className={styles.stageEmoji}>
                      {s.isUnlocked ? info.emoji : '🔒'}
                    </Text>
                    <View className={styles.stageInfo}>
                      <Text className={styles.stageName}>
                        {s.isUnlocked ? info.name : '???'}
                      </Text>
                      <Text className={styles.stageRequire}>
                        {s.require.realmName}境解锁
                      </Text>
                    </View>
                    <Text className={`${styles.stageBadge} ${s.isCurrent ? styles.stageBadgeCurrent : s.isUnlocked ? styles.stageBadgeUnlocked : styles.stageBadgeLocked}`}>
                      {s.isCurrent ? '📍 当前' : s.isUnlocked ? '✅ 已解锁' : '⬜ 未解锁'}
                    </Text>
                  </View>
                  <Text className={styles.stageDesc}>
                    {s.isUnlocked ? s.require.description : `距${s.require.realmName}境还需 ${s.needCultivation} 修为`}
                  </Text>
                  {isExpanded && (
                    <View className={styles.stageExtra}>
                      <View className={styles.stageExtraRow}>
                        <Text className={styles.stageExtraLabel}>形态阶段</Text>
                        <Text className={styles.stageExtraValue}>{info.emoji} {info.name}</Text>
                      </View>
                      <View className={styles.stageExtraRow}>
                        <Text className={styles.stageExtraLabel}>解锁境界</Text>
                        <Text className={styles.stageExtraValue}>{s.require.realmName}境</Text>
                      </View>
                      <View className={styles.stageExtraRow}>
                        <Text className={styles.stageExtraLabel}>特性描述</Text>
                        <Text className={styles.stageExtraValue}>{s.require.description}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            🎨 装饰收藏
            {!isDecorationUnlocked && '（筑基境解锁）'}
          </Text>
          {isDecorationUnlocked ? (
            <>
              <View className={styles.decorationGrid}>
                {DECORATIONS.map((d) => (
                  <View
                    key={d.id}
                    className={`${styles.decorationItem} ${!d.unlocked ? styles.decorationItemLocked : ''}`}
                  >
                    <Text className={styles.decorationEmoji}>
                      {d.unlocked ? d.emoji : '🔒'}
                    </Text>
                    <Text className={styles.decorationName}>{d.unlocked ? d.name : '???'}</Text>
                  </View>
                ))}
              </View>
              <Text className={styles.decorationCount}>已收集 {collectedDecorations}/{DECORATIONS.length}</Text>
            </>
          ) : (
            <View className={styles.lockedHint}>
              <Text className={styles.lockedHintText}>🔒 修为达到筑基境（2000）即可解锁装饰系统</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default BeastPediaPage;
