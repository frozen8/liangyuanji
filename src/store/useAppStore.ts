import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Beast } from '@/types/beast';
import type { User, CoupleMemberInfo } from '@/types/user';
import { callFunction } from '@/services/cloud';

interface LoginResult {
  openid: string;
  userInfo: User;
}

interface AppState {
  user: User | null;
  beast: Beast | null;
  partner: CoupleMemberInfo | null;
  weddingDate: string;
  spirit: number; // 灵石池余额
  openid: string;
  coupleId: string;
  isLoggedIn: boolean;
  loginLoading: boolean;
  setUserInfo: (user: User) => void;
  setBeast: (beast: Beast) => void;
  setPartner: (partner: CoupleMemberInfo | null) => void;
  setWeddingDate: (date: string) => void;
  setSpirit: (spirit: number) => void;
  setCoupleId: (coupleId: string) => void;
  ensureLogin: () => Promise<void>;
  setLoginLoading: (loading: boolean) => void;
  clearCoupleData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  beast: null,
  partner: null,
  weddingDate: '2026-10-01',
  spirit: 0,
  openid: '',
  coupleId: '',
  isLoggedIn: false,
  loginLoading: true,
  setUserInfo: (user) =>
    set({ user, openid: user.openid, coupleId: user.coupleId || '' }),
  setBeast: (beast) => set({ beast }),
  setPartner: (partner) => set({ partner }),
  setWeddingDate: (weddingDate) => set({ weddingDate }),
  setSpirit: (spirit) => set({ spirit }),
  setCoupleId: (coupleId) => set({ coupleId }),
  setLoginLoading: (loginLoading) => set({ loginLoading }),
  clearCoupleData: () => set({ coupleId: '', partner: null, beast: null, weddingDate: '2026-10-01', spirit: 0 }),
  ensureLogin: async () => {
    if (get().isLoggedIn) return;
    set({ loginLoading: true });
    try {
      const res = await callFunction<LoginResult>('login');
      set({
        user: res.userInfo,
        openid: res.openid,
        coupleId: res.userInfo.coupleId || '',
        isLoggedIn: true,
        loginLoading: false
      });
      console.info('[Store] 登录成功:', res.openid, 'coupleId:', res.userInfo.coupleId);
    } catch (err) {
      console.error('[Store] 登录失败:', err);
      set({ loginLoading: false });
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  }
}));
