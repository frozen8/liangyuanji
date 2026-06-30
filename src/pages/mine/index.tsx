import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { useAppStore } from '@/store/useAppStore';
import { REALM_LIST } from '@/utils/constants';
import type { Beast } from '@/types/beast';
import { useCoupleGuard } from '@/hooks/useCoupleGuard';
import styles from './index.module.scss';

interface CoupleMember {
  openid: string;
  nickname: string;
  avatar: string;
  isSelf: boolean;
}

interface UnbindRequest {
  initiator: string;
  status: string;
  createTime: any;
}

interface MenuItem {
  emoji: string;
  text: string;
  url?: string;
  action?: string;
  badge?: string;
}

const MinePage: React.FC = () => {
  useCoupleGuard();
  const [beast, setBeast] = useState<Beast | null>(null);
  const [members, setMembers] = useState<CoupleMember[]>([]);
  const [spirit, setSpirit] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState<{ stoneRate: number; remainRmb: number; spentPercent: number; isOverBudget: boolean } | null>(null);
  const [unbindRequest, setUnbindRequest] = useState<UnbindRequest | null>(null);
  const [isBound, setIsBound] = useState(true);
  const [acting, setActing] = useState(false);
  const { weddingDate, coupleId, openid, clearCoupleData } = useAppStore();

  const loadMineData = async () => {
    try {
      const [beastRes, statsRes] = await Promise.all([
        callFunction<{ beast: Beast }>('getBeast', { coupleId }),
        callFunction<{ summary: { coupleMembers: CoupleMember[]; spirit: number; budgetStatus: { stoneRate: number; remainRmb: number; spentPercent: number; isOverBudget: boolean } } }>('getStats', { type: 'mine', coupleId })
      ]);
      setBeast(beastRes.beast);
      setMembers(statsRes.summary.coupleMembers);
      setSpirit(statsRes.summary.spirit);
      setBudgetStatus(statsRes.summary.budgetStatus);
    } catch (err) {
      console.error('[Mine] 加载数据失败:', err);
    }
  };

  useEffect(() => {
    loadMineData();
  }, []);

  // onShow 时刷新解绑请求、绑定状态与灵石池数据
  useDidShow(() => {
    if (!coupleId) return;
    loadMineData();
    callFunction<{ isBound: boolean; memberCount: number; unbindRequest: UnbindRequest | null }>('getCoupleStatus', { coupleId })
      .then((res) => {
        setUnbindRequest(res.unbindRequest);
        setIsBound(res.isBound);
        if (res.memberCount === 0) {
          clearCoupleData();
        }
      })
      .catch((err) => console.error('[Mine] 查询绑定状态失败:', err));
  });

  // 境界信息
  const realmIndex = beast ? REALM_LIST.findIndex((r) => r.level === beast.realm) : 0;
  const currentRealm = REALM_LIST[realmIndex];
  const nextRealm = REALM_LIST[realmIndex + 1];
  const cultivation = beast?.cultivation || 0;
  const progress = nextRealm
    ? Math.round(((cultivation - currentRealm.minCultivation) / (currentRealm.maxCultivation - currentRealm.minCultivation)) * 100)
    : 100;
  const affinity = beast?.stats.affinity || 0;

  const goTo = (url: string) => Taro.navigateTo({ url });

  // 发起解绑请求
  const handleRequestUnbind = () => {
    Taro.showModal({
      title: '解除绑定',
      content: '解除绑定需对方同意，同意后将销毁所有共同数据（灵兽、降妖录、灵石簿等），此操作不可撤销。确定发起解绑请求吗？',
      confirmText: '发起请求',
      confirmColor: '#F53F3F',
      success: async (res) => {
        if (!res.confirm) return;
        setActing(true);
        try {
          await callFunction('unbindCouple', { coupleId, action: 'request' });
          Taro.showToast({ title: '已发出请求', icon: 'success' });
          const status = await callFunction<{ unbindRequest: UnbindRequest | null }>('getCoupleStatus', { coupleId });
          setUnbindRequest(status.unbindRequest);
        } catch (err: any) {
          Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
        } finally {
          setActing(false);
        }
      }
    });
  };

  // 同意解绑
  const handleConfirmUnbind = async () => {
    setActing(true);
    try {
      await callFunction('unbindCouple', { coupleId, action: 'confirm' });
      Taro.showToast({ title: '已解除绑定', icon: 'success' });
      clearCoupleData();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      setActing(false);
    }
  };

  // 拒绝解绑
  const handleRejectUnbind = async () => {
    setActing(true);
    try {
      await callFunction('unbindCouple', { coupleId, action: 'reject' });
      Taro.showToast({ title: '已拒绝', icon: 'success' });
      const status = await callFunction<{ unbindRequest: UnbindRequest | null }>('getCoupleStatus', { coupleId });
      setUnbindRequest(status.unbindRequest);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      setActing(false);
    }
  };

  // 撤销解绑请求
  const handleCancelUnbind = async () => {
    setActing(true);
    try {
      await callFunction('unbindCouple', { coupleId, action: 'cancel' });
      Taro.showToast({ title: '已撤销', icon: 'success' });
      const status = await callFunction<{ unbindRequest: UnbindRequest | null }>('getCoupleStatus', { coupleId });
      setUnbindRequest(status.unbindRequest);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      setActing(false);
    }
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.action === 'unbind') {
      handleRequestUnbind();
    } else if (item.url) {
      goTo(item.url);
    }
  };

  const menuGroups: Array<Array<MenuItem>> = [
    [
      { emoji: '📖', text: '灵兽图鉴', url: '/pages/beast-pedia/index' },
      { emoji: '🏆', text: '成就墙', url: '/pages/achievement/index', badge: '5' }
    ],
    [
      { emoji: '📊', text: '修炼统计', url: '/pages/cultivate-history/index' },
      { emoji: '💰', text: '账单统计', url: '/pages/ledger-stats/index' }
    ],
    [
      isBound
        ? { emoji: '💔', text: '解除绑定', action: 'unbind' }
        : { emoji: '💞', text: '邀请绑定', url: '/pages/invite/index' },
      { emoji: '💒', text: '飞升日设置', url: '/pages/wedding-day/index' },
      { emoji: '⚙️', text: '设置', url: '/pages/settings/index' }
    ]
  ];

  const isInitiator = unbindRequest && unbindRequest.initiator === openid;
  const hasPendingUnbind = unbindRequest && unbindRequest.status === 'pending';

  return (
    <View className={styles.minePage}>
      {/* 解绑请求横幅 */}
      {hasPendingUnbind && (
        <View className={`${styles.unbindBanner} ${isInitiator ? styles.unbindBannerWait : styles.unbindBannerDanger}`}>
          <Text className={styles.unbindBannerText}>
            {isInitiator ? '⏳ 等待对方同意解除绑定' : '💔 对方请求解除绑定'}
          </Text>
          <View className={styles.unbindActions}>
            {isInitiator ? (
              <View
                className={`${styles.unbindBtn} ${styles.unbindBtnOutline}`}
                onClick={acting ? undefined : handleCancelUnbind}
              >
                {acting ? '处理中...' : '撤销请求'}
              </View>
            ) : (
              <>
                <View
                  className={`${styles.unbindBtn} ${styles.unbindBtnDanger}`}
                  onClick={acting ? undefined : handleConfirmUnbind}
                >
                  {acting ? '处理中...' : '同意'}
                </View>
                <View
                  className={`${styles.unbindBtn} ${styles.unbindBtnOutline}`}
                  onClick={acting ? undefined : handleRejectUnbind}
                >
                  拒绝
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* 双人卡片 */}
      <View className={styles.coupleCard}>
        <View className={styles.coupleAvatars}>
          {members.map((m, idx) => (
            <React.Fragment key={m.openid}>
              <View className={styles.coupleAvatarWrap}>
                {m.avatar ? (
                  <Image className={styles.coupleAvatar} src={m.avatar} mode="aspectFill" />
                ) : (
                  <View className={styles.coupleAvatarPlaceholder}><Text>👤</Text></View>
                )}
                <Text className={styles.coupleNickname}>{m.nickname}</Text>
              </View>
              {idx === 0 && <Text className={styles.coupleHeart}>💞</Text>}
            </React.Fragment>
          ))}
        </View>
        <View className={styles.affinityRow}>
          <Text className={styles.affinityLabel}>姻缘指数</Text>
          <Text className={styles.affinityValue}>{affinity}</Text>
        </View>
        <Text className={styles.bindStatus}>{isBound ? `已结契 · 距飞升 ${weddingDate}` : '未结契 · 等待伴侣'}</Text>
      </View>

      {/* 境界卡片 */}
      {beast && (
        <View className={styles.realmCard}>
          <View className={styles.realmHeader}>
            <Text className={styles.realmName}>☯ {currentRealm.name} · {beast.name}</Text>
            <Text className={styles.realmLevel}>Lv.{beast.level}</Text>
          </View>
          <View className={styles.realmProgress}>
            <View className={styles.realmFill} style={{ width: `${progress}%` }} />
          </View>
          <View className={styles.realmMeta}>
            <Text>{currentRealm.description}</Text>
            {nextRealm && <Text>距 {nextRealm.name} {nextRealm.minCultivation - cultivation} 修为</Text>}
          </View>
        </View>
      )}

      {/* 灵石池（可点击跳转预算修改） */}
      <View className={styles.spiritCard} onClick={() => goTo('/pages/budget-edit/index')}>
        <View className={styles.spiritLeft}>
          <Text className={styles.spiritEmoji}>💎</Text>
          <View className={styles.spiritInfo}>
            <Text className={styles.spiritLabel}>灵石池余额</Text>
            <Text className={styles.spiritValue}>{spirit}</Text>
          </View>
        </View>
        <Text className={styles.spiritTip}>
          {budgetStatus
            ? `≈ ¥${budgetStatus.remainRmb.toFixed(2)} · 已用 ${budgetStatus.spentPercent}%${budgetStatus.isOverBudget ? ' · ⚠️ 超支' : ''} · 点击修改 ›`
            : '点击修改预算 ›'}
        </Text>
      </View>

      {/* 功能入口 */}
      {menuGroups.map((group, gIdx) => (
        <View className={styles.menuGroup} key={gIdx}>
          {group.map((item) => (
            <View className={styles.menuItem} key={item.text} onClick={() => handleMenuClick(item)}>
              <Text className={styles.menuEmoji}>{item.emoji}</Text>
              <Text className={styles.menuText}>{item.text}</Text>
              {item.badge && <Text className={styles.menuBadge}>{item.badge}</Text>}
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

export default MinePage;
