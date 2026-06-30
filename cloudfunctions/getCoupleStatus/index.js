const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    let { coupleId } = event
    const openid = cloud.getWXContext().OPENID

    // 兼容旧前端：未传 coupleId 时从 users 集合查
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0) return { code: -1, message: '用户不存在', data: { openid } }
      coupleId = users[0].coupleId
      if (!coupleId) return { code: -1, message: '未绑定情侣', data: null }
    }

    const { data: couples } = await db.collection('couples').where({ _id: coupleId }).get()
    if (couples.length === 0) return { code: -1, message: '关系不存在', data: null }

    const couple = couples[0]
    const members = couple.members || []
    return {
      code: 0,
      message: 'success',
      data: {
        coupleId,
        memberCount: members.length,
        isBound: members.length >= 2,
        unbindRequest: couple.unbindRequest || null
      }
    }
  } catch (err) {
    console.error('[getCoupleStatus] error:', err)
    return { code: -1, message: err.message || '查询失败', data: null }
  }
}
