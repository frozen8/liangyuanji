import type { User } from '@/types/user';

export default function login(): Promise<{ openid: string; userInfo: User }> {
  return Promise.resolve({
    openid: 'mock_openid_001',
    userInfo: {
      openid: 'mock_openid_001',
      nickname: '良人',
      avatar: 'https://picsum.photos/id/64/200/200',
      coupleId: 'mock_couple_001',
      createTime: '2026-06-01 10:00:00'
    }
  });
}
