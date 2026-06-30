const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { direction, duration } = event
    let { coupleId } = event

    console.info('[startCultivate] event:', JSON.stringify(event))

    // 兼容 coupleId 参数，未传则从 users 查
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
      coupleId = users[0].coupleId
    }

    if (!coupleId) return { code: -1, message: '未绑定情侣', data: null }

    const res = await db.collection('cultivate_sessions').add({
      data: { coupleId, direction, duration, startAt: db.serverDate(), status: 'ongoing', userOpenid: openid, isDual: false }
    })
    console.info('[startCultivate] success:', res._id, 'coupleId:', coupleId)
    return { code: 0, message: 'success', data: { sessionId: res._id } }
  } catch (err) {
    console.error('[startCultivate] error:', err)
    return { code: -1, message: err.message || '开始失败', data: null }
  }
}
