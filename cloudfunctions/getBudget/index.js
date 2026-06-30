const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: -1, message: '未绑定关系', data: null }

    const { data: budgets } = await db.collection('budgets').where({ coupleId }).get()
    const budget = budgets[0] || {
      coupleId,
      totalBudget: 80000,
      stoneRate: 1,
      categoryBudget: { dress: 0, hotel: 0, catering: 0, gift: 0, decoration: 0, other: 0 }
    }

    // 实时计算已花灵石（汇总该 couple 所有账单）
    const { data: ledgers } = await db.collection('ledgers').where({ coupleId }).get()
    const spent = ledgers.reduce((s, l) => s + (l.amount || 0), 0)
    const totalBudget = budget.totalBudget || 0
    const stoneRate = budget.stoneRate || 1
    const remain = totalBudget - spent

    console.info('[getBudget] success, spent:', spent, 'remain:', remain)
    return {
      code: 0,
      message: 'success',
      data: {
        budget: {
          coupleId,
          totalBudget,
          stoneRate,
          categoryBudget: budget.categoryBudget || {},
          updateTime: budget.updateTime || ''
        },
        spent,
        remain,
        remainRmb: remain * stoneRate,
        spentRmb: spent * stoneRate
      }
    }
  } catch (err) {
    console.error('[getBudget] error:', err)
    return { code: -1, message: err.message || '获取失败', data: null }
  }
}
