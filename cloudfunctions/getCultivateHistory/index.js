const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { month, page, pageSize } = event || {}

    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: 0, message: 'success', data: { sessions: [], total: 0, stats: { totalCount: 0, totalMinutes: 0, totalCultivation: 0, dualCount: 0 } } }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: 0, message: 'success', data: { sessions: [], total: 0, stats: { totalCount: 0, totalMinutes: 0, totalCultivation: 0, dualCount: 0 } } }

    // 查询已结束的修炼会话（completed + abandoned）
    const query = { coupleId, status: _.in(['completed', 'abandoned']) }
    const { data: sessions } = await db.collection('cultivate_sessions').where(query).orderBy('startAt', 'desc').get()

    // _id → id 映射
    let sessionsWithId = sessions.map((s) => ({ ...s, id: s._id }))

    // 月份过滤
    if (month) {
      sessionsWithId = sessionsWithId.filter((s) => {
        const startAt = s.startAt
        if (typeof startAt === 'string') return startAt.startsWith(month)
        return new Date(startAt).toISOString().startsWith(month)
      })
    }

    const total = sessionsWithId.length

    // 统计（仅 completed）
    const completed = sessionsWithId.filter((s) => s.status === 'completed')
    const stats = {
      totalCount: completed.length,
      totalMinutes: completed.reduce((sum, s) => sum + (s.duration || 0), 0),
      totalCultivation: completed.reduce((sum, s) => sum + (s.reward?.cultivation || 0), 0),
      dualCount: completed.filter((s) => s.isDual).length
    }

    console.info('[getCultivateHistory] success:', sessionsWithId.length)
    return {
      code: 0,
      message: 'success',
      data: { sessions: sessionsWithId, total, stats }
    }
  } catch (err) {
    console.error('[getCultivateHistory] error:', err)
    return { code: -1, message: err.message || '获取失败', data: null }
  }
}
