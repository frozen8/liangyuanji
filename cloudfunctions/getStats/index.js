const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 原生 Date 实现 YYYY-MM-DD 格式化，避免 dayjs 依赖
function formatYYYYMMDD(date) {
  if (!date) return ''
  // 字符串直接取前 10 位（兼容 'YYYY-MM-DD' 和 'YYYY-MM-DD HH:mm:ss'）
  if (typeof date === 'string') return date.slice(0, 10)
  // Date 对象转 ISO 再取前 10 位
  return new Date(date).toISOString().slice(0, 10)
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    let { coupleId } = event

    // 兼容旧前端：未传 coupleId 时从 users 集合查
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
      coupleId = users[0].coupleId
      if (!coupleId) return { code: -1, message: '未绑定关系', data: null }
    }

    const today = formatYYYYMMDD(new Date())

    // 今日到期任务
    const { data: tasks } = await db.collection('tasks').where({ coupleId, deadline: today }).get()
    const todayTasks = tasks.map((t) => ({ ...t, id: t._id }))

    // 修炼会话（已完成）
    const { data: sessions } = await db.collection('cultivate_sessions').where({ coupleId, status: 'completed' }).get()
    const todaySessions = sessions.filter((s) => formatYYYYMMDD(s.startAt) === today)
    const todayCultivate = {
      completedCount: todaySessions.length,
      totalMinutes: todaySessions.reduce((s, x) => s + (x.duration || 0), 0),
      totalCultivation: todaySessions.reduce((s, x) => s + (x.reward?.cultivation || 0), 0)
      // v1.1：移除 totalSpirit（修炼不再产出灵石）
    }

    // 预算状态（实时计算）
    const { data: budgets } = await db.collection('budgets').where({ coupleId }).get()
    const budgetDoc = budgets[0] || { totalBudget: 0, stoneRate: 1 }
    const { data: allLedgers } = await db.collection('ledgers').where({ coupleId }).get()
    const totalSpent = allLedgers.reduce((s, l) => s + (l.amount || 0), 0)
    const totalBudget = budgetDoc.totalBudget || 0
    const stoneRate = budgetDoc.stoneRate || 1
    const remain = totalBudget - totalSpent
    const budgetStatus = {
      total: totalBudget,
      spent: totalSpent,
      remain,
      spentPercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      isOverBudget: totalSpent > totalBudget,
      stoneRate,
      remainRmb: remain * stoneRate,
      spentRmb: totalSpent * stoneRate
    }

    // 今日灵石消耗
    const todayLedgers = allLedgers.filter((l) => formatYYYYMMDD(l.date) === today)
    const todaySpirit = {
      spent: todayLedgers.reduce((s, l) => s + (l.amount || 0), 0),
      saved: 0
    }

    // 情侣成员
    const { data: members } = await db.collection('users').where({ coupleId }).get()
    const coupleMembers = members.map((m) => ({
      id: m._id,
      openid: m._openid,
      nickname: m.nickname,
      avatar: m.avatar,
      isSelf: m._openid === openid
    }))

    // 婚礼日期
    const { data: couples } = await db.collection('couples').where({ _id: coupleId }).get()
    const weddingDate = couples[0]?.weddingDate || '2026-10-01'

    const summary = {
      todayTasks,
      todayCultivate,
      todaySpirit,
      coupleMembers,
      weddingDate,
      spirit: remain, // 灵石池余额 = 预算剩余
      budgetStatus
    }

    console.info('[getStats] success')
    return { code: 0, message: 'success', data: { summary } }
  } catch (err) {
    console.error('[getStats] error:', err)
    return { code: -1, message: err.message || '获取失败', data: null }
  }
}
