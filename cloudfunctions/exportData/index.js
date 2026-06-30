const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: -1, message: '未绑定关系', data: null }

    // 并行查询所有业务数据（均按 coupleId 隔离）
    const [tasksRes, ledgersRes, sessionsRes, achievementsRes, beastsRes, couplesRes] = await Promise.all([
      db.collection('tasks').where({ coupleId }).get(),
      db.collection('ledgers').where({ coupleId }).get(),
      db.collection('cultivate_sessions').where({ coupleId }).get(),
      db.collection('achievements').where({ coupleId }).get(),
      db.collection('beasts').where({ coupleId }).get(),
      db.collection('couples').where({ _id: coupleId }).get()
    ])

    const data = {
      exportTime: new Date().toISOString(),
      couple: {
        id: coupleId,
        weddingDate: couplesRes.data[0]?.weddingDate || '',
        stoneRate: couplesRes.data[0]?.stoneRate || 1,
        members: couplesRes.data[0]?.members || []
      },
      tasks: tasksRes.data.length,
      ledgers: ledgersRes.data.length,
      cultivateSessions: sessionsRes.data.length,
      achievements: achievementsRes.data.filter((a) => a.unlocked).length,
      beast: beastsRes.data[0] ? {
        name: beastsRes.data[0].name,
        stage: beastsRes.data[0].stage,
        realm: beastsRes.data[0].realm,
        cultivation: beastsRes.data[0].cultivation
      } : null
    }

    console.info('[exportData] success:', coupleId)
    return {
      code: 0,
      message: 'success',
      data: { json: JSON.stringify(data, null, 2) }
    }
  } catch (err) {
    console.error('[exportData] error:', err)
    return { code: -1, message: err.message || '导出失败', data: null }
  }
}
