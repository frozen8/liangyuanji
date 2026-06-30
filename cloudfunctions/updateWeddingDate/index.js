const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    let { coupleId, weddingDate } = event

    if (!weddingDate) return { code: -1, message: '缺少 weddingDate', data: null }

    // 兼容旧前端：未传 coupleId 时从 users 集合查
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
      coupleId = users[0].coupleId
      if (!coupleId) return { code: -1, message: '未绑定情侣', data: null }
    }

    const updateRes = await db.collection('couples').where({ _id: coupleId }).update({
      data: { weddingDate }
    })
    console.info('[updateWeddingDate] 更新结果:', JSON.stringify(updateRes), 'coupleId:', coupleId)

    if (updateRes.stats.updated === 0) {
      return { code: -1, message: '关系不存在或无变更', data: null }
    }

    return {
      code: 0,
      message: 'success',
      data: { coupleId, weddingDate }
    }
  } catch (err) {
    console.error('[updateWeddingDate] error:', err)
    return { code: -1, message: err.message || '更新失败', data: null }
  }
}
