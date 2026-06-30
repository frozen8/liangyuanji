// 用户与情侣类型

export interface User {
  openid: string;
  nickname: string;
  avatar: string;
  coupleId: string;
  createTime: string;
}

export interface Couple {
  id: string;
  inviteCode: string;
  members: string[]; // openid 数组
  weddingDate: string; // 婚礼日期 YYYY-MM-DD
  createTime: string;
}

export interface CoupleMemberInfo {
  openid: string;
  nickname: string;
  avatar: string;
  isSelf: boolean;
}
