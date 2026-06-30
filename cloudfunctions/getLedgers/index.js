const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { month, category } = event || {}
    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) {
      return { code: 0, message: 'success', data: { ledgers: [], stats: { totalSpent: 0, categoryStats: [], recorderStats: [], sourceStats: { taskAmount: 0, manualAmount: 0, taskCount: 0, manualCount: 0 } } } }
    }
    const coupleId = users[0].coupleId
    if (!coupleId) {
      return { code: 0, message: 'success', data: { ledgers: [], stats: { totalSpent: 0, categoryStats: [], recorderStats: [], sourceStats: { taskAmount: 0, manualAmount: 0, taskCount: 0, manualCount: 0 } } } }
    }

    const query = { coupleId }
    if (category && category !== 'all') query.category = category
    const { data: ledgers } = await db.collection('ledgers').where(query).orderBy('date', 'desc').orderBy('createTime', 'desc').get()

    // _id → id 映射
    const ledgersWithId = ledgers.map((l) => ({ ...l, id: l._id }))

    const totalSpent = ledgersWithId.reduce((s, l) => s + (l.amount || 0), 0)

    // 分类统计
    const catMap = {}
    const recMap = {}
    // 来源统计（v1.1 新增：task 降妖 vs manual 独立）
    let taskAmount = 0, manualAmount = 0, taskCount = 0, manualCount = 0
    ledgersWithId.forEach((l) => {
      catMap[l.category] = (catMap[l.category] || 0) + l.amount
      if (!recMap[l.recorder]) recMap[l.recorder] = { name: l.recorderName, avatar: l.recorderAvatar, amount: 0 }
      recMap[l.recorder].amount += l.amount
      if (l.sourceType === 'task') {
        taskAmount += l.amount
        taskCount += 1
      } else {
        manualAmount += l.amount
        manualCount += 1
      }
    })
    const categoryStats = Object.entries(catMap)
      .map(([c, a]) => ({ category: c, amount: a, percent: totalSpent > 0 ? Math.round((a / totalSpent) * 100) : 0 }))
      .sort((x, y) => y.amount - x.amount)
    const recorderStats = Object.entries(recMap).map(([oid, v]) => ({ openid: oid, ...v }))
    const sourceStats = { taskAmount, manualAmount, taskCount, manualCount }

    console.info('[getLedgers] success:', ledgersWithId.length)
    return {
      code: 0,
      message: 'success',
      data: { ledgers: ledgersWithId, stats: { totalSpent, categoryStats, recorderStats, sourceStats } }
    }
  } catch (err) {
    console.error('[getLedgers] error:', err)
    return { code: -1, message: err.message || '获取失败', data: null }
  }
}
