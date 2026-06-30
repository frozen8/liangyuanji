import React, { useEffect } from 'react';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import './app.scss';

function App(props) {
  const { ensureLogin } = useAppStore();

  useEffect(() => {
    // 初始化微信云开发（仅微信平台），随后触发登录
    if (process.env.TARO_ENV === 'weapp') {
      try {
        // 云环境 ID 需替换为真实值（见 .trae/documents/微信云开发登录与多情侣数据隔离接入计划.md 阶段0）
        Taro.cloud.init({ env: 'cloudbase-d7g66kq25452fdb96', traceUser: true });
        console.info('[App] 云开发初始化成功');
        ensureLogin();
      } catch (err) {
        console.error('[App] 云开发初始化失败:', err);
      }
    } else {
      // H5 预览环境走 mock，直接触发登录（mock login 会返回 mock_openid_001）
      ensureLogin();
    }
  }, []);

  useDidShow(() => {});

  useDidHide(() => {});

  // Taro 小程序要求 App 组件必须始终返回 props.children，否则页面不会被注册
  return props.children;
}

export default App;
