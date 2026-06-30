import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { callFunction } from '@/services/cloud';
import styles from './index.module.scss';

const DEFAULT_SETTINGS = {
  notifyTask: true,
  notifyCultivate: true,
  notifyBudget: true,
  notifyPartner: false,
  remindTaskTime: '09:00',
  remindCultivateTime: '21:00'
};

const APP_VERSION = 'v1.0.0';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [cacheSize, setCacheSize] = useState('0KB');

  useEffect(() => {
    loadSettings();
    loadCacheSize();
  }, []);

  const loadSettings = () => {
    try {
      const stored = Taro.getStorageSync('app_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...stored });
      }
    } catch (err) {
      console.error('[Settings] 加载设置失败:', err);
    }
  };

  const saveSettings = (newSettings: typeof DEFAULT_SETTINGS) => {
    setSettings(newSettings);
    try {
      Taro.setStorageSync('app_settings', newSettings);
    } catch (err) {
      console.error('[Settings] 保存设置失败:', err);
    }
  };

  const loadCacheSize = () => {
    try {
      const info = Taro.getStorageInfoSync();
      const sizeKB = info.currentSize;
      if (sizeKB < 1024) {
        setCacheSize(`${sizeKB}KB`);
      } else {
        setCacheSize(`${(sizeKB / 1024).toFixed(2)}MB`);
      }
    } catch (err) {
      setCacheSize('0KB');
    }
  };

  const handleToggle = (key: keyof typeof DEFAULT_SETTINGS, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Taro.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？不会影响你的备婚数据。',
      confirmText: '清除',
      success: (res) => {
        if (res.confirm) {
          try {
            // 保留用户设置和登录态
            const keepKeys = ['app_settings', 'user_token', 'user_info'];
            const info = Taro.getStorageInfoSync();
            info.keys.forEach((key) => {
              if (!keepKeys.includes(key)) {
                Taro.removeStorageSync(key);
              }
            });
            Taro.showToast({ title: '已清除缓存', icon: 'success' });
            loadCacheSize();
          } catch (err) {
            Taro.showToast({ title: '清除失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleExportData = async () => {
    Taro.showLoading({ title: '导出中...' });
    try {
      const res = await callFunction<{ json: string }>('exportData', {});
      Taro.setClipboardData({
        data: res.json,
        success: () => {
          Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
        }
      });
    } catch (err) {
      Taro.showToast({ title: '导出失败', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleResetData = () => {
    Taro.showModal({
      title: '⚠️ 危险操作',
      content: '将清除所有备婚数据（任务、账单、修炼记录等），且不可恢复。确定继续？',
      confirmText: '确定重置',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '二次确认',
            content: '真的要重置所有数据吗？此操作不可撤销！',
            confirmText: '我已知晓',
            confirmColor: '#F53F3F',
            success: (res2) => {
              if (res2.confirm) {
                try {
                  Taro.clearStorageSync();
                  Taro.showToast({ title: '数据已重置', icon: 'success' });
                  setTimeout(() => {
                    Taro.reLaunch({ url: '/pages/index/index' });
                  }, 1500);
                } catch (err) {
                  Taro.showToast({ title: '重置失败', icon: 'none' });
                }
              }
            }
          });
        }
      }
    });
  };

  const handleTimePick = (key: 'remindTaskTime' | 'remindCultivateTime', label: string) => {
    Taro.showActionSheet({
      itemList: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
      success: (res) => {
        const times = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
        const selected = times[res.tapIndex];
        handleToggle(key, selected);
      }
    });
  };

  const handleAbout = () => {
    Taro.showModal({
      title: '关于良缘纪',
      content: `版本：${APP_VERSION}\n\n良缘纪是一款修仙风备婚小程序，融合任务管理、记账、番茄钟与灵兽养成。\n\n愿每一对新人都能修成正果，飞升登仙。`,
      showCancel: false,
      confirmText: '知道了'
    });
  };

  const handleFeedback = () => {
    Taro.showToast({ title: '反馈功能开发中', icon: 'none' });
  };

  const handleRate = () => {
    Taro.showToast({ title: '感谢支持', icon: 'none' });
  };

  const handleJoinGroup = () => {
    Taro.setClipboardData({
      data: 'liangyuanji_group_2026',
      success: () => {
        Taro.showToast({ title: '群号已复制', icon: 'success' });
      }
    });
  };

  return (
    <View className={styles.settingsPage}>
      <ScrollView scrollY className={styles.scrollArea}>
        {/* 通知设置 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>🔔 通知设置</Text>
          <View className={styles.row}>
            <Text className={styles.rowLabel}>任务到期提醒</Text>
            <Switch
              checked={settings.notifyTask}
              onChange={(e) => handleToggle('notifyTask', e.detail.value)}
              color="#ff6b9d"
            />
          </View>
          <View className={styles.row}>
            <Text className={styles.rowLabel}>修炼提醒</Text>
            <Switch
              checked={settings.notifyCultivate}
              onChange={(e) => handleToggle('notifyCultivate', e.detail.value)}
              color="#ff6b9d"
            />
          </View>
          <View className={styles.row}>
            <Text className={styles.rowLabel}>超支预警</Text>
            <Switch
              checked={settings.notifyBudget}
              onChange={(e) => handleToggle('notifyBudget', e.detail.value)}
              color="#ff6b9d"
            />
          </View>
          <View className={styles.row}>
            <Text className={styles.rowLabel}>伴侣动态</Text>
            <Switch
              checked={settings.notifyPartner}
              onChange={(e) => handleToggle('notifyPartner', e.detail.value)}
              color="#ff6b9d"
            />
          </View>
        </View>

        {/* 提醒时间 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>⏰ 提醒时间</Text>
          <View className={styles.row} onClick={() => handleTimePick('remindTaskTime', '任务提醒')}>
            <Text className={styles.rowLabel}>任务到期提醒</Text>
            <View className={styles.rowRight}>
              <Text className={styles.rowValue}>{settings.remindTaskTime}</Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
          <View className={styles.row} onClick={() => handleTimePick('remindCultivateTime', '修炼提醒')}>
            <Text className={styles.rowLabel}>修炼提醒</Text>
            <View className={styles.rowRight}>
              <Text className={styles.rowValue}>{settings.remindCultivateTime}</Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
        </View>

        {/* 数据管理 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>💾 数据管理</Text>
          <View className={styles.row} onClick={handleClearCache}>
            <Text className={styles.rowLabel}>清除缓存</Text>
            <View className={styles.rowRight}>
              <Text className={styles.rowValue}>{cacheSize}</Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
          <View className={styles.row} onClick={handleExportData}>
            <Text className={styles.rowLabel}>导出备婚数据</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
          <View className={`${styles.row} ${styles.rowDanger}`} onClick={handleResetData}>
            <Text className={`${styles.rowLabel} ${styles.rowLabelDanger}`}>重置所有数据</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
        </View>

        {/* 关于 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>ℹ️ 关于</Text>
          <View className={styles.row}>
            <Text className={styles.rowLabel}>版本号</Text>
            <View className={styles.rowRight}>
              <Text className={styles.rowValue}>{APP_VERSION}</Text>
            </View>
          </View>
          <View className={styles.row} onClick={handleAbout}>
            <Text className={styles.rowLabel}>关于良缘纪</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
          <View className={styles.row}>
            <Text className={styles.rowLabel}>用户协议</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
          <View className={styles.row}>
            <Text className={styles.rowLabel}>隐私政策</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
        </View>

        {/* 反馈 */}
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>💬 反馈</Text>
          <View className={styles.row} onClick={handleFeedback}>
            <Text className={styles.rowLabel}>意见反馈</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
          <View className={styles.row} onClick={handleRate}>
            <Text className={styles.rowLabel}>给我们评分</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
          <View className={styles.row} onClick={handleJoinGroup}>
            <Text className={styles.rowLabel}>加入备婚交流群</Text>
            <View className={styles.rowRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
        </View>

        <View className={styles.footer}>
          <Text className={styles.footerText}>良缘纪 · 修成正果 · 飞升登仙</Text>
          <Text className={styles.footerVersion}>{APP_VERSION}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsPage;
