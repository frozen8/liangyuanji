import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import Taro, { useShareAppMessage } from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import { useAppStore } from '@/store/useAppStore';
import { daysUntil, formatDate } from '@/utils/format';
import styles from './index.module.scss';

type TabKey = 'create' | 'join';

const InvitePage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('create');
  const [weddingDate, setWeddingDate] = useState('2026-10-01');
  const [nickname, setNickname] = useState('');
  const [totalBudget, setTotalBudget] = useState('80000'); // 婚礼总预算（灵石池）
  const [stoneRate, setStoneRate] = useState('1'); // 灵石与人民币换算比例
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [bound, setBound] = useState(false);

  const { weddingDate: storeWeddingDate, setWeddingDate: setStoreWeddingDate, setCoupleId, coupleId } = useAppStore();

  const handleCreate = async () => {
    if (!weddingDate) {
      Taro.showToast({ title: '请选择婚礼日期', icon: 'none' });
      return;
    }
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    const budgetNum = Number(totalBudget);
    const rateNum = Number(stoneRate);
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      Taro.showToast({ title: '请输入有效的婚礼总预算', icon: 'none' });
      return;
    }
    if (!Number.isFinite(rateNum) || rateNum <= 0) {
      Taro.showToast({ title: '请输入有效的换算比例', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const res = await callFunction<{ coupleId: string; inviteCode: string; beast: { id: string; name: string; stage: string } }>(
        'createCouple',
        { weddingDate, nickname: nickname.trim(), totalBudget: budgetNum, stoneRate: rateNum }
      );
      setCreatedCode(res.inviteCode);
      setCoupleId(res.coupleId);
      setStoreWeddingDate(weddingDate);
      Taro.showToast({ title: '姻缘已创建', icon: 'success' });
    } catch (err) {
      console.error('[Invite] 创建失败:', err);
      Taro.showToast({ title: '创建失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 8) {
      Taro.showToast({ title: '请输入8位邀请码', icon: 'none' });
      return;
    }
    if (!joinNickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const res = await callFunction<{ coupleId: string; beast: any }>('bindCouple', {
        inviteCode: joinCode.trim().toUpperCase(),
        nickname: joinNickname.trim()
      });
      setCoupleId(res.coupleId);
      setBound(true);
      Taro.showToast({ title: '绑定成功！', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      }, 1500);
    } catch (err) {
      console.error('[Invite] 绑定失败:', err);
      Taro.showToast({ title: '邀请码无效', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    Taro.setClipboardData({
      data: createdCode,
      success: () => Taro.showToast({ title: '已复制', icon: 'success' })
    });
  };

  const handleShare = () => {
    Taro.showShareMenu({ withShareTicket: true });
  };

  const handleUnbind = () => {
    Taro.showModal({
      title: '解除绑定',
      content: '解除后双方将不再共享灵兽与修为，此操作不可撤销，确定解除吗？',
      confirmText: '解除',
      confirmColor: '#F53F3F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await callFunction('unbindCouple', { coupleId: 'mock_couple_001' });
            setBound(false);
            setCreatedCode('');
            Taro.showToast({ title: '已解除', icon: 'success' });
          } catch (err) {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleDateChange = (e: any) => {
    setWeddingDate(e.detail.value);
  };

  // A 方轮询检测 B 方是否已绑定（每 3 秒查询一次 couple 的 members）
  useEffect(() => {
    if (!createdCode || !coupleId) return;
    console.info('[Invite] 启动绑定状态轮询, coupleId:', coupleId);
    const timer = setInterval(async () => {
      try {
        const res = await callFunction<{ isBound: boolean; memberCount: number }>('getCoupleStatus', { coupleId });
        console.info('[Invite] 轮询结果:', res);
        if (res.isBound) {
          setBound(true);
          setCreatedCode('');
          Taro.showToast({ title: '伴侣已绑定！', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/home/index' });
          }, 1500);
        }
      } catch (err) {
        console.error('[Invite] 轮询检测失败:', err);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [createdCode, coupleId]);

  useShareAppMessage(() => ({
    title: '💞 我在良缘纪等你，一起养育姻缘灵兽吧！',
    path: `/pages/invite/index?code=${createdCode || inviteCode}`,
    imageUrl: ''
  }));

  const countdown = daysUntil(storeWeddingDate);

  // 已绑定状态
  if (bound) {
    return (
      <View className={styles.invitePage}>
        <View className={styles.boundCard}>
          <Text className={styles.boundEmoji}>💞</Text>
          <Text className={styles.boundTitle}>姻缘已结</Text>
          <View className={styles.boundAvatars}>
            <View className={styles.boundAvatarWrap}>
              <Text className={styles.boundAvatarEmoji}>👨</Text>
              <Text className={styles.boundNickname}>{nickname || '良人'}</Text>
            </View>
            <Text className={styles.boundHeart}>💞</Text>
            <View className={styles.boundAvatarWrap}>
              <Text className={styles.boundAvatarEmoji}>👩</Text>
              <Text className={styles.boundNickname}>{joinNickname || '佳人'}</Text>
            </View>
          </View>
          <View className={styles.boundInfo}>
            <Text className={styles.boundInfoItem}>绑定时间：{formatDate(new Date().toISOString())}</Text>
            <Text className={styles.boundInfoItem}>距飞升日：{countdown} 天</Text>
            <Text className={styles.boundInfoItem}>姻缘指数：85</Text>
          </View>
        </View>
        <View className={styles.unbindBtn} onClick={handleUnbind}>
          <Text className={styles.unbindText}>⚠️ 解除绑定</Text>
        </View>
      </View>
    );
  }

  // 创建成功，显示邀请码
  if (createdCode) {
    return (
      <View className={styles.invitePage}>
        <View className={styles.codeCard}>
          <Text className={styles.codeEmoji}>🎫</Text>
          <Text className={styles.codeTitle}>你的邀请码</Text>
          <Text className={styles.codeValue}>{createdCode}</Text>
          <Text className={styles.codeTip}>将邀请码分享给伴侣，对方输入后即可绑定</Text>
          <View className={styles.codeActions}>
            <Button className={styles.codeBtn} onClick={handleCopy}>📋 复制</Button>
            <Button className={styles.codeBtnPrimary} openType="share" onClick={handleShare}>📤 分享给伴侣</Button>
          </View>
          <View className={styles.waiting}>
            <Text className={styles.waitingDot}>⏳</Text>
            <Text className={styles.waitingText}>等待伴侣绑定...</Text>
          </View>
        </View>
      </View>
    );
  }

  // 未绑定，Tab 切换
  return (
    <View className={styles.invitePage}>
      <View className={styles.guideCard}>
        <Text className={styles.guideEmoji}>💞</Text>
        <Text className={styles.guideTitle}>姻缘绑定</Text>
        <Text className={styles.guideDesc}>邀请你的伴侣共同养育姻缘灵兽{'\n'}开启双修之旅</Text>
      </View>

      <View className={styles.tabBar}>
        <View
          className={`${styles.tabItem} ${tab === 'create' ? styles.tabItemActive : ''}`}
          onClick={() => setTab('create')}
        >
          <Text className={styles.tabText}>创建关系</Text>
        </View>
        <View
          className={`${styles.tabItem} ${tab === 'join' ? styles.tabItemActive : ''}`}
          onClick={() => setTab('join')}
        >
          <Text className={styles.tabText}>输入邀请码</Text>
        </View>
      </View>

      {tab === 'create' ? (
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>📅 婚礼日期</Text>
            <Picker mode="date" value={weddingDate} start="2026-01-01" end="2027-12-31" onChange={handleDateChange}>
              <View className={styles.pickerValue}>
                <Text>{weddingDate}</Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>👤 你的昵称</Text>
            <Input
              className={styles.input}
              placeholder="请输入昵称"
              maxlength={10}
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>💎 婚礼总预算（灵石池）</Text>
            <Input
              className={styles.input}
              type="digit"
              placeholder="如 80000"
              value={totalBudget}
              onInput={(e) => setTotalBudget(e.detail.value)}
            />
            <Text className={styles.formHint}>
              💡 灵石池总额创建后仍可在「仙府-灵石池」中修改，换算比例不可修改。当前 ≈ ¥{(Number(totalBudget) * Number(stoneRate) || 0).toFixed(2)}
            </Text>
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>💱 灵石与人民币换算比例</Text>
            <Input
              className={styles.input}
              type="digit"
              placeholder="如 1 表示 1 灵石 = 1 元"
              value={stoneRate}
              onInput={(e) => setStoneRate(e.detail.value)}
            />
            <Text className={styles.formHint}>
              ⚠️ 换算比例创建后不可修改。1 灵石 = {Number(stoneRate) || 0} 元
            </Text>
          </View>
          <Button
            className={styles.submitBtn}
            loading={loading}
            onClick={handleCreate}
          >
            💞 创建姻缘
          </Button>
        </View>
      ) : (
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>🎫 输入伴侣的邀请码</Text>
            <Input
              className={styles.codeInput}
              placeholder="8位邀请码"
              maxlength={8}
              value={joinCode}
              onInput={(e) => setJoinCode(e.detail.value.toUpperCase())}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>👤 你的昵称</Text>
            <Input
              className={styles.input}
              placeholder="请输入昵称"
              maxlength={10}
              value={joinNickname}
              onInput={(e) => setJoinNickname(e.detail.value)}
            />
          </View>
          <Button
            className={styles.submitBtn}
            loading={loading}
            onClick={handleJoin}
          >
            🤝 绑定伴侣
          </Button>
        </View>
      )}
    </View>
  );
};

export default InvitePage;
