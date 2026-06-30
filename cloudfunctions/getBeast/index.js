const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    let { coupleId } = event

    // 兼容旧前端：未传 coupleId 时从 users 集合查
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0 || !users[0].coupleId) return { code: -1, message: '未绑定情侣', data: null }
      coupleId = users[0].coupleId
    }

    const { data: beasts } = await db.collection('beasts').where({ coupleId }).get()
    if (beasts.length === 0) return { code: -1, message: '灵兽不存在', data: null }
    const beast = beasts[0]
    console.info('[getBeast] success, coupleId:', coupleId)
    return { code: 0, message: 'success', data: { beast: { ...beast, id: beast._id } } }
  } catch (err) {
    console.error('[getBeast] error:', err)
    return { code: -1, message: err.message || '获取失败', data: null }
  }
}
