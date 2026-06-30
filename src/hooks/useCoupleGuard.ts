import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';

/**
 * 关系绑定拦截 hook。
 * 在 tab 页 onShow 时检查 coupleId，未绑定则 reLaunch 到 invite 页。
 * 仅在登录完成且当前不在 invite 页时触发，避免循环跳转。
 */
export function useCoupleGuard() {
  const { coupleId, isLoggedIn, loginLoading } = useAppStore();

  useEffect(() => {
    if (loginLoading || !isLoggedIn) return;
    if (!coupleId) {
      const currentPages = Taro.getCurrentPages();
      const currentRoute = currentPages[currentPages.length - 1]?.route || '';
      if (!currentRoute.includes('pages/invite/index')) {
        Taro.reLaunch({ url: '/pages/invite/index' });
      }
    }
  }, [coupleId, isLoggedIn, loginLoading]);
}
